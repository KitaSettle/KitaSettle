import type {
  DecisionFactorWeights,
  DecisionInputSource,
  DecisionItem,
  DecisionLearningEvent,
  DecisionLearningEventType,
  DecisionStatus,
} from "@/lib/types/decision-engine";
import { DEFAULT_DECISION_WEIGHTS } from "@/lib/types/decision-engine";
import { createId, nowIso } from "@/lib/utils";
import type { DecisionRepository } from "../decision-repository";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MockDecisionRepository implements DecisionRepository {
  private items = new Map<string, DecisionItem[]>();
  private weights = new Map<string, DecisionFactorWeights>();
  private events = new Map<string, DecisionLearningEvent[]>();

  private key(userId: string, date: string): string {
    return `${userId}:${date}`;
  }

  async getWeights(userId: string): Promise<DecisionFactorWeights> {
    return clone(this.weights.get(userId) ?? DEFAULT_DECISION_WEIGHTS);
  }

  async saveWeights(userId: string, weights: DecisionFactorWeights): Promise<void> {
    this.weights.set(userId, clone(weights));
  }

  async upsertDecisions(userId: string, items: DecisionItem[]): Promise<void> {
    for (const item of items) {
      const bucket = this.items.get(this.key(userId, item.queuedFor)) ?? [];
      const index = bucket.findIndex((existing) => existing.externalKey === item.externalKey);
      if (index >= 0) bucket[index] = clone(item);
      else bucket.push(clone(item));
      bucket.sort((a, b) => b.score - a.score);
      this.items.set(this.key(userId, item.queuedFor), bucket);
    }
  }

  async listForDate(userId: string, date: string): Promise<DecisionItem[]> {
    return clone(this.items.get(this.key(userId, date)) ?? []);
  }

  async listPending(userId: string, date?: string): Promise<DecisionItem[]> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    return clone((this.items.get(this.key(userId, targetDate)) ?? []).filter((item) => item.status === "pending"));
  }

  async updateStatus(userId: string, id: string, status: DecisionStatus): Promise<DecisionItem | null> {
    for (const [bucketKey, bucket] of this.items.entries()) {
      if (!bucketKey.startsWith(`${userId}:`)) continue;
      const index = bucket.findIndex((item) => item.id === id);
      if (index >= 0) {
        bucket[index] = { ...bucket[index], status, updatedAt: nowIso() };
        return clone(bucket[index]);
      }
    }
    return null;
  }

  async recordLearningEvent(
    userId: string,
    event: Omit<DecisionLearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void> {
    const created: DecisionLearningEvent = {
      ...event,
      id: createId("dec-learn"),
      userId,
      createdAt: nowIso(),
    };
    const events = this.events.get(userId) ?? [];
    events.unshift(created);
    this.events.set(userId, events);
  }

  async getLearningHistory(userId: string, limit = 50): Promise<DecisionLearningEvent[]> {
    return clone((this.events.get(userId) ?? []).slice(0, limit));
  }
}
