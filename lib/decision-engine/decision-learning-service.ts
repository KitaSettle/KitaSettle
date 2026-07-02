import type { Repositories } from "@/lib/repositories";
import type {
  DecisionFactorWeights,
  DecisionInputSource,
  DecisionItem,
  DecisionLearningEventType,
} from "@/lib/types/decision-engine";
import { DEFAULT_DECISION_WEIGHTS } from "@/lib/types/decision-engine";

export class DecisionLearningService {
  constructor(private repos: Repositories) {}

  async recordOutcome(
    userId: string,
    decision: DecisionItem,
    eventType: DecisionLearningEventType,
    reason: string,
  ): Promise<DecisionFactorWeights> {
    const adjustments = this.computeAdjustments(decision, eventType);
    const current = await this.repos.decisions.getWeights(userId);
    const next = this.applyAdjustments(current, adjustments);

    await this.repos.decisions.saveWeights(userId, next);
    await this.repos.decisions.recordLearningEvent(userId, {
      decisionId: decision.id,
      externalKey: decision.externalKey,
      eventType,
      source: decision.source,
      scoreBefore: decision.score,
      weightAdjustments: adjustments,
      reason,
    });

    return next;
  }

  private computeAdjustments(
    decision: DecisionItem,
    eventType: DecisionLearningEventType,
  ): Partial<DecisionFactorWeights> {
    const sourceBoost = this.sourceWeightKey(decision.source);
    const delta = this.deltaForEvent(eventType);
    if (!sourceBoost) return {};

    return {
      [sourceBoost]: Math.max(
        0.02,
        Math.min(0.3, (DEFAULT_DECISION_WEIGHTS[sourceBoost] ?? 0.1) + delta),
      ),
    } as Partial<DecisionFactorWeights>;
  }

  private deltaForEvent(eventType: DecisionLearningEventType): number {
    switch (eventType) {
      case "completed":
      case "accepted":
        return 0.01;
      case "ignored":
      case "rejected":
      case "dismissed":
        return -0.015;
      case "delayed":
        return -0.005;
      default:
        return 0;
    }
  }

  private sourceWeightKey(source: DecisionInputSource): keyof DecisionFactorWeights | null {
    switch (source) {
      case "email":
      case "approval":
        return "urgency";
      case "document":
      case "deadline":
        return "financialEffect";
      case "calendar":
        return "impact";
      case "research":
      case "knowledge":
      case "memory":
        return "learningValue";
      case "project":
      case "executive_dna":
        return "strategicImportance";
      default:
        return "confidence";
    }
  }

  private applyAdjustments(
    current: DecisionFactorWeights,
    adjustments: Partial<DecisionFactorWeights>,
  ): DecisionFactorWeights {
    const next: DecisionFactorWeights = { ...current, ...adjustments };
    const total = Object.values(next).reduce((sum, value) => sum + value, 0);
    if (total <= 0) return { ...DEFAULT_DECISION_WEIGHTS };

    return {
      impact: next.impact / total,
      urgency: next.urgency / total,
      risk: next.risk / total,
      confidence: next.confidence / total,
      dependencies: next.dependencies / total,
      estimatedTime: next.estimatedTime / total,
      energyRequired: next.energyRequired / total,
      financialEffect: next.financialEffect / total,
      strategicImportance: next.strategicImportance / total,
      learningValue: next.learningValue / total,
    };
  }
}
