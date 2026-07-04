import type { Repositories } from "@/lib/repositories";
import type { ExecutiveConnectSnapshot } from "@/lib/types/executive-connect";
import type {
  DecisionItem,
  DecisionLearningEventType,
  DecisionQueuePayload,
} from "@/lib/types/decision-engine";
import { createId, nowIso } from "@/lib/utils";
import { collectDecisionCandidates } from "./decision-input-collector";
import { DecisionExplainer } from "./decision-explainer";
import { DecisionLearningService } from "./decision-learning-service";
import { DecisionQueue } from "./decision-queue";
import { DecisionScoreEngine } from "./decision-scoring-service";
import { DecisionTimelineService } from "./decision-timeline";

export class DecisionEngine {
  private scoreEngine = new DecisionScoreEngine();
  private explainer = new DecisionExplainer();
  private queue = new DecisionQueue();
  private learning: DecisionLearningService;
  private timeline: DecisionTimelineService;

  constructor(private repos: Repositories) {
    this.learning = new DecisionLearningService(repos);
    this.timeline = new DecisionTimelineService(repos);
  }

  async generateMorningQueue(
    userId: string,
    connect: ExecutiveConnectSnapshot,
  ): Promise<DecisionQueuePayload> {
    const today = new Date().toISOString().slice(0, 10);
    const [weights, dnaProfile, existing] = await Promise.all([
      this.repos.decisions.getWeights(userId),
      this.repos.executiveDna.getProfile(userId),
      this.repos.decisions.listForDate(userId, today),
    ]);

    const completedKeys = new Set(
      existing.filter((item) => item.status !== "pending").map((item) => item.externalKey),
    );

    const candidates = await collectDecisionCandidates(userId, this.repos, connect, dnaProfile);
    const filtered = candidates.filter((candidate) => !completedKeys.has(candidate.externalKey));
    const scored = this.scoreEngine.scoreCandidates(filtered, weights);

    const explained: DecisionItem[] = [];
    for (const candidate of scored.slice(0, 12)) {
      const { explanation, because, explanationDetail } = await this.explainer.explain(candidate);
      explained.push({
        id: createId("decision"),
        userId,
        externalKey: candidate.externalKey,
        title: candidate.title,
        actionLabel: candidate.actionLabel,
        source: candidate.source,
        sourceRef: candidate.sourceRef ?? null,
        factors: candidate.factors,
        score: candidate.score,
        confidence: candidate.confidence,
        explanation,
        because,
        explanationDetail,
        status: "pending",
        queuedFor: today,
        metadata: candidate.metadata ?? {},
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    await this.repos.decisions.upsertDecisions(userId, explained);

    const merged = await this.repos.decisions.listForDate(userId, today);
    const mergedByKey = new Map(merged.map((item) => [item.externalKey, item]));

    for (const item of explained.slice(0, 3)) {
      const persisted = mergedByKey.get(item.externalKey);
      if (persisted) {
        await this.timeline.recordQueued(userId, persisted);
      }
    }

    return this.queue.build(merged, weights);
  }

  async applyOutcome(
    userId: string,
    decisionId: string,
    eventType: DecisionLearningEventType,
    reason: string,
  ): Promise<DecisionItem | null> {
    const status = eventType === "accepted" ? "accepted" : eventType === "dismissed" ? "dismissed" : eventType;
    const updated = await this.repos.decisions.updateStatus(userId, decisionId, status);
    if (!updated) return null;

    await this.learning.recordOutcome(userId, updated, eventType, reason);
    await this.timeline.recordOutcome(userId, updated, eventType, reason);
    return updated;
  }

  async getTimeline(userId: string, limit = 30) {
    return this.timeline.getTimeline(userId, limit);
  }
}

export function createDecisionEngine(repos: Repositories): DecisionEngine {
  return new DecisionEngine(repos);
}
