import type {
  KnowledgeEngine,
  KnowledgeItem,
  KnowledgeSearchQuery,
} from "@/lib/types/knowledge";
import type { EntityId } from "@/lib/types/common";
import { nowIso } from "@/lib/utils";
import type { KnowledgeRepository } from "@/lib/repositories/knowledge-repository";
import type { Repositories } from "@/lib/repositories";
import { getScriptRepositories } from "@/lib/repositories/script";

export class SupabaseKnowledgeEngine implements KnowledgeEngine {
  constructor(
    private repository: KnowledgeRepository,
    private userId: string,
  ) {}

  getAll(): Promise<KnowledgeItem[]> {
    return this.repository.getAll(this.userId);
  }

  getById(id: EntityId): Promise<KnowledgeItem | null> {
    return this.repository.getById(this.userId, id);
  }

  search(query: KnowledgeSearchQuery): Promise<KnowledgeItem[]> {
    return this.repository.search(this.userId, query);
  }

  create(item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem> {
    return this.repository.create(this.userId, {
      ...item,
      lastReviewed: item.lastReviewed ?? nowIso(),
    });
  }

  update(id: EntityId, patch: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    return this.repository.update(this.userId, id, {
      ...patch,
      lastReviewed: patch.lastReviewed ?? nowIso(),
    });
  }

  delete(id: EntityId): Promise<boolean> {
    return this.repository.delete(this.userId, id);
  }
}

export async function createKnowledgeEngine(
  userId: string,
  repos?: Repositories,
): Promise<SupabaseKnowledgeEngine> {
  const repositories = repos ?? getScriptRepositories();
  return new SupabaseKnowledgeEngine(repositories.knowledge, userId);
}
