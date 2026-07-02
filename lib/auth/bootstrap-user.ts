import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIExecutiveBriefOutput } from "@/lib/ai/types";
import { createRepositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";
import { createId, nowIso } from "@/lib/utils";

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

function createStarterBrief(): AIExecutiveBriefOutput {
  const generatedAt = nowIso();
  return {
    id: createId("brief"),
    headline: "Welcome to KitaSettle",
    executiveSummary:
      "Complete your getting-to-know-you conversation so Kita can prepare briefs that fit how you work. Once discovery is done, your daily focus will appear here.",
    topPriorities: [
      {
        id: createId("priority"),
        title: "Complete discovery",
        description: "Tell Kita about your role, goals, and how you like to work.",
      },
    ],
    risks: [],
    opportunities: [],
    recommendedActions: ["Open discovery and answer a few questions to get started."],
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
): Promise<void> {
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

  if (userError) throw userError;

  await repos.executiveDna.ensureProfile(userId);

  const existingBrief = await repos.executiveBriefs.getLatestBrief(userId);
  if (!existingBrief) {
    await repos.executiveBriefs.saveBrief(userId, createStarterBrief());
  }
}

export async function ensureUserBootstrapped(
  userId: string,
  email?: string | null,
  name?: string | null,
): Promise<void> {
  const safeEmail = email?.trim() ?? "";
  const safeName = resolveDisplayName(safeEmail, name);
  const client = await createClient();

  const { error: rpcError } = await client.rpc("bootstrap_user_account", {
    p_user_id: userId,
    p_email: safeEmail,
    p_name: safeName,
  });

  if (!rpcError) return;

  if (!isMissingBootstrapRpc(rpcError)) {
    throw rpcError;
  }

  await bootstrapWithClientFallback(client, userId, safeEmail, safeName);
}
