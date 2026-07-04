import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIExecutiveBriefOutput } from "@/lib/ai/types";
import { isSchemaMissingError } from "@/lib/database/schema-health";
import { createRepositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";
import { createId, nowIso } from "@/lib/utils";

export interface BootstrapResult {
  method: "rpc" | "client_fallback" | "skipped";
  ok: boolean;
  error?: string;
  errorCode?: string;
  failedStep?: string;
}

function resolveDisplayName(email: string, name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim();
  return local || "Executive";
}

function isMissingBootstrapRpc(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST202" ||
    message.includes("bootstrap_user_account") ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  );
}

function formatBootstrapError(error: unknown): { message: string; code?: string } {
  if (isSchemaMissingError(error)) {
    return {
      message:
        "Database schema is missing on Supabase. Apply migrations once via POST /api/setup/apply-schema.",
      code: "PGRST205",
    };
  }

  if (error && typeof error === "object") {
    const record = error as { message?: string; code?: string };
    return {
      message: record.message ?? "Bootstrap failed.",
      code: record.code,
    };
  }

  return { message: error instanceof Error ? error.message : "Bootstrap failed." };
}

function createStarterBrief(): AIExecutiveBriefOutput {
  const generatedAt = nowIso();
  return {
    id: createId("brief"),
    headline: "Welcome to KitaSettle",
    executiveSummary:
      "Complete your First Conversation so Kita can prepare briefings that fit how you work. Once that's done, your daily focus will appear here.",
    topPriorities: [
      {
        id: createId("priority"),
        title: "Complete your First Conversation",
        description: "Tell Kita about your role, goals, and how you like to work.",
      },
    ],
    risks: [],
    opportunities: [],
    recommendedActions: ["Continue your First Conversation to get started."],
    estimatedReadingSaved: "5 minutes",
    confidence: 40,
    topicsUsed: ["Onboarding"],
    generatedAt,
    mock: true,
  };
}

async function bootstrapWithClientFallback(
  client: SupabaseClient,
  userId: string,
  email: string,
  name: string,
): Promise<BootstrapResult> {
  const repos = createRepositories(client);
  const displayName = resolveDisplayName(email, name);

  const { error: userError } = await client.from("users").upsert(
    {
      id: userId,
      name: displayName,
      email,
    },
    { onConflict: "id" },
  );

  if (userError) {
    const formatted = formatBootstrapError(userError);
    return {
      method: "client_fallback",
      ok: false,
      error: formatted.message,
      errorCode: formatted.code,
      failedStep: "public.users upsert",
    };
  }

  try {
    await repos.executiveDna.ensureProfile(userId);
  } catch (error) {
    const formatted = formatBootstrapError(error);
    return {
      method: "client_fallback",
      ok: false,
      error: formatted.message,
      errorCode: formatted.code,
      failedStep: "executive_dna_profiles insert",
    };
  }

  try {
    const existingBrief = await repos.executiveBriefs.getLatestBrief(userId);
    if (!existingBrief) {
      await repos.executiveBriefs.saveBrief(userId, createStarterBrief());
    }
  } catch (error) {
    const formatted = formatBootstrapError(error);
    return {
      method: "client_fallback",
      ok: false,
      error: formatted.message,
      errorCode: formatted.code,
      failedStep: "executive_briefs insert",
    };
  }

  return { method: "client_fallback", ok: true };
}

export async function ensureUserBootstrapped(
  userId: string,
  email?: string | null,
  name?: string | null,
): Promise<BootstrapResult> {
  const safeEmail = email?.trim() ?? "";
  const safeName = resolveDisplayName(safeEmail, name);
  const client = await createClient();

  const { error: rpcError } = await client.rpc("bootstrap_user_account", {
    p_user_id: userId,
    p_email: safeEmail,
    p_name: safeName,
  });

  if (!rpcError) {
    return { method: "rpc", ok: true };
  }

  if (isSchemaMissingError(rpcError)) {
    const formatted = formatBootstrapError(rpcError);
    return {
      method: "rpc",
      ok: false,
      error: formatted.message,
      errorCode: formatted.code,
      failedStep: "bootstrap_user_account rpc",
    };
  }

  if (!isMissingBootstrapRpc(rpcError)) {
    const formatted = formatBootstrapError(rpcError);
    return {
      method: "rpc",
      ok: false,
      error: formatted.message,
      errorCode: formatted.code,
      failedStep: "bootstrap_user_account rpc",
    };
  }

  return bootstrapWithClientFallback(client, userId, safeEmail, safeName);
}
