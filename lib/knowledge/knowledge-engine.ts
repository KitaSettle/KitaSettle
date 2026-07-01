import type {
  KnowledgeEngine,
  KnowledgeItem,
  KnowledgeSearchQuery,
} from "@/lib/types/knowledge";
import type { EntityId } from "@/lib/types/common";
import { createId, matchesAnyField, nowIso } from "@/lib/utils";
import { mockKnowledgeItems } from "./mock-knowledge-store";

export class MockKnowledgeEngine implements KnowledgeEngine {
  private items: KnowledgeItem[];

  constructor(seed: KnowledgeItem[] = mockKnowledgeItems) {
    this.items = [...seed];
  }

  async getAll(): Promise<KnowledgeItem[]> {
    return [...this.items];
  }

  async getById(id: EntityId): Promise<KnowledgeItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async search(query: KnowledgeSearchQuery): Promise<KnowledgeItem[]> {
    return this.items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.subcategory && item.subcategory !== query.subcategory) return false;
      if (query.source && item.source !== query.source) return false;
      if (query.importance && item.importance !== query.importance) return false;
      if (query.tags?.length && !query.tags.some((tag) => item.tags.includes(tag))) {
        return false;
      }

      return matchesAnyField(
        query.query,
        [item.title, item.summary, item.content, item.source, item.category, item.subcategory],
        item.tags,
      );
    });
  }

  async create(item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem> {
    const created: KnowledgeItem = {
      ...item,
      id: createId("know"),
      lastReviewed: nowIso(),
    };
    this.items.unshift(created);
    return created;
  }

  async update(id: EntityId, patch: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated: KnowledgeItem = {
      ...this.items[index],
      ...patch,
      id,
      lastReviewed: nowIso(),
    };
    this.items[index] = updated;
    return updated;
  }

  async delete(id: EntityId): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }
}

export const knowledgeEngine = new MockKnowledgeEngine();
