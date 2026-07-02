import { createScriptClient } from "@/lib/supabase/script";
import { isSupabaseConfigured } from "@/lib/config/env";

const DEFAULT_DAILY_BUDGET_USD = 5;

function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export class AiBudgetExceededError extends Error {
  constructor() {
    super("Daily AI budget reached. Please try again tomorrow.");
    this.name = "AiBudgetExceededError";
  }
}

export async function assertAiBudgetAvailable(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const client = createScriptClient();
  const dayStart = startOfUtcDayIso();

  const [{ data: userRow }, { data: usageRows }] = await Promise.all([
    client.from("users").select("daily_ai_budget_usd").eq("id", userId).maybeSingle(),
    client
      .from("ai_usage_events")
      .select("estimated_cost_usd")
      .eq("user_id", userId)
      .gte("created_at", dayStart),
  ]);

  const budget = Number(userRow?.daily_ai_budget_usd ?? DEFAULT_DAILY_BUDGET_USD);
  const spent = (usageRows ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd ?? 0),
    0,
  );

  if (spent >= budget) {
    throw new AiBudgetExceededError();
  }
}
