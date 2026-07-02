import type { AiUsageRecord } from "@/lib/types/mission-control";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createScriptClient } from "@/lib/supabase/script";
import { secureLogger } from "@/lib/security/logger";

const MODEL_COST_PER_1K: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_COST_PER_1K[model] ?? MODEL_COST_PER_1K["gpt-4o-mini"];
  return (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
}

export async function recordAiUsage(record: AiUsageRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const client = createScriptClient();
    await client.from("ai_usage_events").insert({
      user_id: record.userId ?? null,
      feature: record.feature,
      model: record.model,
      prompt_tokens: record.promptTokens,
      completion_tokens: record.completionTokens,
      estimated_cost_usd: record.estimatedCostUsd || estimateCost(record.model, record.promptTokens, record.completionTokens),
      response_time_ms: record.responseTimeMs ?? null,
      cached: record.cached ?? false,
      error: record.error ?? false,
    });
  } catch {
    secureLogger.warn("ai_usage_record_failed", { feature: record.feature });
  }
}

export { estimateCost };
