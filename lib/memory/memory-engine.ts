import type {
  MemoryEngine,
  MemoryItem,
  MemorySearchQuery,
} from "@/lib/types/memory";
import type { EntityId } from "@/lib/types/common";
import { createId, matchesAnyField, nowIso } from "@/lib/utils";
import { mockMemoryItems } from "./mock-memory-store";

export class MockMemoryEngine implements MemoryEngine {
  private items: MemoryItem[];

  constructor(seed: MemoryItem[] = mockMemoryItems) {
    this.items = [...seed];
  }

  async getAll(): Promise<MemoryItem[]> {
    return [...this.items];
  }

  async getById(id: EntityId): Promise<MemoryItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async search(query: MemorySearchQuery): Promise<MemoryItem[]> {
    return this.items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.importance && item.importance !== query.importance) return false;
      if (query.status && item.status !== query.status) return false;

      return matchesAnyField(
        query.query,
        [item.title, item.description, item.category],
      );
    });
  }

  async create(item: Omit<MemoryItem, "id" | "createdAt">): Promise<MemoryItem> {
    const created: MemoryItem = {
      ...item,
      id: createId("mem"),
      createdAt: nowIso(),
    };
    this.items.unshift(created);
    return created;
  }

  async update(id: EntityId, patch: Partial<MemoryItem>): Promise<MemoryItem | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = { ...this.items[index], ...patch, id };
    this.items[index] = updated;
    return updated;
  }

  async archive(id: EntityId): Promise<MemoryItem | null> {
    return this.update(id, { status: "archived" });
  }
}

export const memoryEngine = new MockMemoryEngine();
