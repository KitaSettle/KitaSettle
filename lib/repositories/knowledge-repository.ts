import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbKnowledge } from "@/lib/database/types";
import type { KnowledgeItem, KnowledgeSearchQuery } from "@/lib/types/knowledge";
import type { EntityId } from "@/lib/types/common";
import { matchesAnyField } from "@/lib/utils";

export interface KnowledgeRepository {
  getAll(userId: string): Promise<KnowledgeItem[]>;
  getById(userId: string, id: EntityId): Promise<KnowledgeItem | null>;
  search(userId: string, query: KnowledgeSearchQuery): Promise<KnowledgeItem[]>;
  create(userId: string, item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem>;
  update(
    userId: string,
    id: EntityId,
    patch: Partial<KnowledgeItem>,
  ): Promise<KnowledgeItem | null>;
  delete(userId: string, id: EntityId): Promise<boolean>;
}

export function mapKnowledgeRow(row: DbKnowledge): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    source: row.source,
    url: row.url,
    category: row.category,
    subcategory: row.subcategory,
    confidence: row.confidence,
    publishedDate: row.published_date,
    lastReviewed: row.last_reviewed,
    relatedItems: row.related_items,
    tags: row.tags,
    importance: row.importance,
  };
}

function toKnowledgeRow(userId: string, item: Omit<KnowledgeItem, "id">) {
  return {
    user_id: userId,
    title: item.title,
    summary: item.summary,
    content: item.content,
    source: item.source,
    url: item.url,
    category: item.category,
    subcategory: item.subcategory,
    confidence: item.confidence,
    published_date: item.publishedDate,
    last_reviewed: item.lastReviewed,
    related_items: item.relatedItems,
    tags: item.tags,
    importance: item.importance,
  };
}

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(userId: string): Promise<KnowledgeItem[]> {
    const { data, error } = await this.client
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .order("last_reviewed", { ascending: false });

    if (error) throw error;
    return (data as DbKnowledge[]).map(mapKnowledgeRow);
  }

  async getById(userId: string, id: EntityId): Promise<KnowledgeItem | null> {
    const { data, error } = await this.client
      .from("knowledge")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapKnowledgeRow(data as DbKnowledge) : null;
  }

  async search(userId: string, query: KnowledgeSearchQuery): Promise<KnowledgeItem[]> {
    const items = await this.getAll(userId);
    return items.filter((item) => {
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

  async create(userId: string, item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem> {
    const { data, error } = await this.client
      .from("knowledge")
      .insert(toKnowledgeRow(userId, item))
      .select("*")
      .single();

    if (error) throw error;
    return mapKnowledgeRow(data as DbKnowledge);
  }

  async update(
    userId: string,
    id: EntityId,
    patch: Partial<KnowledgeItem>,
  ): Promise<KnowledgeItem | null> {
    const existing = await this.getById(userId, id);
    if (!existing) return null;

    const merged = { ...existing, ...patch, id };
    const { data, error } = await this.client
      .from("knowledge")
      .update({
        title: merged.title,
        summary: merged.summary,
        content: merged.content,
        source: merged.source,
        url: merged.url,
        category: merged.category,
        subcategory: merged.subcategory,
        confidence: merged.confidence,
        published_date: merged.publishedDate,
        last_reviewed: merged.lastReviewed,
        related_items: merged.relatedItems,
        tags: merged.tags,
        importance: merged.importance,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapKnowledgeRow(data as DbKnowledge) : null;
  }

  async delete(userId: string, id: EntityId): Promise<boolean> {
    const { error, count } = await this.client
      .from("knowledge")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
