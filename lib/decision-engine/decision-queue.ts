import type {
  DecisionFactorWeights,
  DecisionItem,
  DecisionQueuePayload,
} from "@/lib/types/decision-engine";

const TOP_ACTION_LIMIT = 3;

export class DecisionQueue {
  build(items: DecisionItem[], weights: DecisionFactorWeights): DecisionQueuePayload {
    const pending = items.filter((item) => item.status === "pending").sort((a, b) => b.score - a.score);
    const topActions = pending.slice(0, TOP_ACTION_LIMIT);

    return {
      generatedAt: new Date().toISOString(),
      topDecision: topActions[0] ?? null,
      topActions,
      allDecisions: pending,
      totalCandidates: items.length,
      weights,
    };
  }
}

export const DECISION_TOP_ACTION_LIMIT = TOP_ACTION_LIMIT;
