import { NextResponse } from "next/server";
import { resolveScriptRepositories } from "@/lib/repositories/factory";
import { generateIfMissing } from "@/lib/executive/daily-brief-service";
import { createScriptClient } from "@/lib/supabase/script";
import { isSupabaseConfigured } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization")?.trim();
  return auth === `Bearer ${secret}`;
}

async function listUserIds(): Promise<string[]> {
  const client = createScriptClient();
  const { data, error } = await client.from("users").select("id");
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ status: "skipped", reason: "Supabase not configured" });
  }

  const summary = { processed: 0, generated: 0, skipped: 0, failed: 0 };

  try {
    const userIds = await listUserIds();
    const repos = resolveScriptRepositories();

    for (const userId of userIds) {
      summary.processed += 1;
      try {
        const payload = await generateIfMissing(userId, repos);
        if (payload.generatedToday) {
          summary.generated += 1;
        } else {
          summary.skipped += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("First Conversation")) {
          summary.skipped += 1;
        } else {
          summary.failed += 1;
          console.error("[KitaSettle] Cron: daily brief failed for user", { userId, error });
        }
      }
    }
  } catch (error) {
    console.error("[KitaSettle] Cron: daily-brief run failed", error);
    return NextResponse.json({ error: "Cron run failed", summary }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", ...summary });
}
