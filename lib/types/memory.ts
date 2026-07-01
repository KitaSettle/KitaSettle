import type { EntityId, Importance, ISO8601 } from "./common";

export type MemoryStatus = "active" | "archived" | "pending";

export interface MemoryItem {
  id: EntityId;
  title: string;
  description: string;
  createdAt: ISO8601;
  category: string;
  importance: Importance;
  relatedKnowledge: EntityId[];
  status: MemoryStatus;
  searchTags?: string[];
}

export interface MemorySearchQuery {
  query?: string;
  category?: string;
  importance?: Importance;
  status?: MemoryStatus;
}

export interface MemoryEngine {
  getAll(): Promise<MemoryItem[]>;
  getById(id: EntityId): Promise<MemoryItem | null>;
  search(query: MemorySearchQuery): Promise<MemoryItem[]>;
  create(item: Omit<MemoryItem, "id" | "createdAt">): Promise<MemoryItem>;
  update(id: EntityId, patch: Partial<MemoryItem>): Promise<MemoryItem | null>;
  archive(id: EntityId): Promise<MemoryItem | null>;
}
