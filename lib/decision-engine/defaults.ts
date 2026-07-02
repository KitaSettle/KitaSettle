import type { DecisionQueuePayload } from "@/lib/types/decision-engine";
import { DEFAULT_DECISION_WEIGHTS } from "@/lib/types/decision-engine";

export const EMPTY_DECISION_QUEUE: DecisionQueuePayload = {
  generatedAt: new Date().toISOString(),
  topActions: [],
  allDecisions: [],
  totalCandidates: 0,
  weights: DEFAULT_DECISION_WEIGHTS,
};

export function isMissingDecisionTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string" ? error.message : String(error);
  return /decision_items|decision_learning|decision_weight|relation .* does not exist|schema cache/i.test(
    message,
  );
}

export async function withDecisionFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingDecisionTableError(error)) return fallback;
    throw error;
  }
}
