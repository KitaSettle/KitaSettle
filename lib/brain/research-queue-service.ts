import type {
  ResearchQueueRecord,
  ResearchQueueService,
  ResearchQueueStatus,
} from "@/lib/types/research";
import type { EntityId } from "@/lib/types/common";
import type { ResearchQueueRepository } from "@/lib/repositories/research-queue-repository";
import type { Repositories } from "@/lib/repositories";
import { getScriptRepositories } from "@/lib/repositories/script";

export class SupabaseResearchQueueService implements ResearchQueueService {
  constructor(
    private repository: ResearchQueueRepository,
    private userId: string,
  ) {}

  list(): Promise<ResearchQueueRecord[]> {
    return this.repository.list(this.userId);
  }

  getById(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.repository.getById(this.userId, id);
  }

  listByStatus(status: ResearchQueueStatus): Promise<ResearchQueueRecord[]> {
    return this.repository.listByStatus(this.userId, status);
  }

  enqueue(
    item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">,
  ): Promise<ResearchQueueRecord> {
    return this.repository.enqueue(this.userId, item);
  }

  updateStatus(id: EntityId, status: ResearchQueueStatus): Promise<ResearchQueueRecord | null> {
    return this.repository.updateStatus(this.userId, id, status);
  }

  approve(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.repository.approve(this.userId, id);
  }

  reject(id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.repository.reject(this.userId, id);
  }
}

export async function createResearchQueueService(
  userId: string,
  repos?: Repositories,
): Promise<SupabaseResearchQueueService> {
  const repositories = repos ?? getScriptRepositories();
  return new SupabaseResearchQueueService(repositories.researchQueue, userId);
}
