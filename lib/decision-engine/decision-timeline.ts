import type { Repositories } from "@/lib/repositories";
import type {
  DecisionItem,
  DecisionLearningEventType,
  DecisionTimelineEntry,
  DecisionTimelinePayload,
} from "@/lib/types/decision-engine";

export class DecisionTimelineService {
  constructor(private repos: Repositories) {}

  async recordQueued(userId: string, decision: DecisionItem): Promise<void> {
    await this.repos.decisions.recordTimelineEntry(userId, {
      decisionId: decision.id,
      title: decision.title,
      actionLabel: decision.actionLabel,
      whyMade: decision.explanationDetail.whyMatters || decision.explanation,
      outcome: null,
      eventType: "queued",
      score: decision.score,
      confidence: decision.confidence,
      source: decision.source,
    });
  }

  async recordOutcome(
    userId: string,
    decision: DecisionItem,
    eventType: DecisionLearningEventType,
    reason: string,
  ): Promise<void> {
    await this.repos.decisions.recordTimelineEntry(userId, {
      decisionId: decision.id,
      title: decision.title,
      actionLabel: decision.actionLabel,
      whyMade: decision.explanationDetail.whyMatters || decision.explanation,
      outcome: reason,
      eventType,
      score: decision.score,
      confidence: decision.confidence,
      source: decision.source,
    });
  }

  async getTimeline(userId: string, limit = 30): Promise<DecisionTimelinePayload> {
    const entries = await this.repos.decisions.getTimeline(userId, limit);
    return { entries, total: entries.length };
  }
}

export type { DecisionTimelineEntry, DecisionTimelinePayload };
