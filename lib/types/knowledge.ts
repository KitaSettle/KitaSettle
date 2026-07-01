import type { EntityId, Importance, ISO8601 } from "./common";

export interface KnowledgeItem {
  id: EntityId;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  category: string;
  subcategory: string;
  confidence: number;
  publishedDate: ISO8601;
  lastReviewed: ISO8601;
  relatedItems: EntityId[];
  tags: string[];
  importance: Importance;
}

export interface KnowledgeSearchQuery {
  query?: string;
  category?: string;
  subcategory?: string;
  source?: string;
  tags?: string[];
  importance?: Importance;
}

export interface KnowledgeEngine {
  getAll(): Promise<KnowledgeItem[]>;
  getById(id: EntityId): Promise<KnowledgeItem | null>;
  search(query: KnowledgeSearchQuery): Promise<KnowledgeItem[]>;
  create(item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem>;
  update(id: EntityId, patch: Partial<KnowledgeItem>): Promise<KnowledgeItem | null>;
  delete(id: EntityId): Promise<boolean>;
}
