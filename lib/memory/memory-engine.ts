import type { MemoryEngine, MemoryItem, MemorySearchQuery } from "@/lib/types/memory";
import type { EntityId } from "@/lib/types/common";
import type { MemoryRepository } from "@/lib/repositories/memory-repository";
import type { Repositories } from "@/lib/repositories";
import { getScriptRepositories } from "@/lib/repositories/script";

export class SupabaseMemoryEngine implements MemoryEngine {
  constructor(
    private repository: MemoryRepository,
    private userId: string,
  ) {}

  getAll(): Promise<MemoryItem[]> {
    return this.repository.getAll(this.userId);
  }

  getById(id: EntityId): Promise<MemoryItem | null> {
    return this.repository.getById(this.userId, id);
  }

  search(query: MemorySearchQuery): Promise<MemoryItem[]> {
    return this.repository.search(this.userId, query);
  }

  create(item: Omit<MemoryItem, "id" | "createdAt">, searchTags?: string[]): Promise<MemoryItem> {
    return this.repository.create(this.userId, item, searchTags);
  }

  update(id: EntityId, patch: Partial<MemoryItem>): Promise<MemoryItem | null> {
    return this.repository.update(this.userId, id, patch);
  }

  archive(id: EntityId): Promise<MemoryItem | null> {
    return this.repository.archive(this.userId, id);
  }
}

export async function createMemoryEngine(
  userId: string,
  repos?: Repositories,
): Promise<SupabaseMemoryEngine> {
  const repositories = repos ?? getScriptRepositories();
  return new SupabaseMemoryEngine(repositories.memory, userId);
}
