import type {
  ResearchQueueRecord,
  ResearchQueueService,
  ResearchQueueStatus,
} from "@/lib/types/research";
import type { EntityId } from "@/lib/types/common";
import { createId, nowIso } from "@/lib/utils";
import { mockResearchQueue } from "./mock-research-queue-store";

export class MockResearchQueueService implements ResearchQueueService {
  private queue: ResearchQueueRecord[];

  constructor(seed: ResearchQueueRecord[] = mockResearchQueue) {
    this.queue = [...seed];
  }

  async list(): Promise<ResearchQueueRecord[]> {
    return [...this.queue];
  }

  async getById(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.queue.find((item) => item.id === id) ?? null;
  }

  async listByStatus(status: ResearchQueueStatus): Promise<ResearchQueueRecord[]> {
    return this.queue.filter((item) => item.status === status);
  }

  async enqueue(
    item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">,
  ): Promise<ResearchQueueRecord> {
    const timestamp = nowIso();
    const created: ResearchQueueRecord = {
      ...item,
      id: createId("rq"),
      status: "Queued",
      queuedAt: timestamp,
      updatedAt: timestamp,
    };
    this.queue.unshift(created);
    return created;
  }

  async updateStatus(
    id: EntityId,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord | null> {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated: ResearchQueueRecord = {
      ...this.queue[index],
      status,
      updatedAt: nowIso(),
    };
    this.queue[index] = updated;
    return updated;
  }

  async approve(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(id, "Approved");
  }

  async reject(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(id, "Rejected");
  }
}

export const researchQueueService = new MockResearchQueueService();
