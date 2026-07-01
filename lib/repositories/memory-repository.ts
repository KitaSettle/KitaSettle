import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbExecutiveMemory } from "@/lib/database/types";
import type { MemoryItem, MemorySearchQuery } from "@/lib/types/memory";
import type { EntityId } from "@/lib/types/common";
import { matchesAnyField } from "@/lib/utils";

export interface MemoryRepository {
  getAll(userId: string): Promise<MemoryItem[]>;
  getById(userId: string, id: EntityId): Promise<MemoryItem | null>;
  search(userId: string, query: MemorySearchQuery): Promise<MemoryItem[]>;
  create(
    userId: string,
    item: Omit<MemoryItem, "id" | "createdAt">,
    searchTags?: string[],
  ): Promise<MemoryItem>;
  update(
    userId: string,
    id: EntityId,
    patch: Partial<MemoryItem>,
  ): Promise<MemoryItem | null>;
  archive(userId: string, id: EntityId): Promise<MemoryItem | null>;
}

export function mapMemoryRow(row: DbExecutiveMemory): MemoryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    category: row.category,
    importance: row.importance,
    relatedKnowledge: row.related_knowledge,
    status: row.status,
    searchTags: row.search_tags,
  };
}

export class SupabaseMemoryRepository implements MemoryRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(userId: string): Promise<MemoryItem[]> {
    const { data, error } = await this.client
      .from("executive_memory")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as DbExecutiveMemory[]).map(mapMemoryRow);
  }

  async getById(userId: string, id: EntityId): Promise<MemoryItem | null> {
    const { data, error } = await this.client
      .from("executive_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapMemoryRow(data as DbExecutiveMemory) : null;
  }

  async search(userId: string, query: MemorySearchQuery): Promise<MemoryItem[]> {
    const items = await this.getAll(userId);
    return items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.importance && item.importance !== query.importance) return false;
      if (query.status && item.status !== query.status) return false;
      return matchesAnyField(query.query, [
        item.title,
        item.description,
        item.category,
      ]);
    });
  }

  async create(
    userId: string,
    item: Omit<MemoryItem, "id" | "createdAt">,
    searchTags: string[] = [],
  ): Promise<MemoryItem> {
    const { data, error } = await this.client
      .from("executive_memory")
      .insert({
        user_id: userId,
        title: item.title,
        description: item.description,
        category: item.category,
        importance: item.importance,
        related_knowledge: item.relatedKnowledge,
        search_tags: searchTags,
        status: item.status,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapMemoryRow(data as DbExecutiveMemory);
  }

  async update(
    userId: string,
    id: EntityId,
    patch: Partial<MemoryItem>,
  ): Promise<MemoryItem | null> {
    const existing = await this.getById(userId, id);
    if (!existing) return null;

    const merged = { ...existing, ...patch, id };
    const { data, error } = await this.client
      .from("executive_memory")
      .update({
        title: merged.title,
        description: merged.description,
        category: merged.category,
        importance: merged.importance,
        related_knowledge: merged.relatedKnowledge,
        status: merged.status,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapMemoryRow(data as DbExecutiveMemory) : null;
  }

  async archive(userId: string, id: EntityId): Promise<MemoryItem | null> {
    return this.update(userId, id, { status: "archived" });
  }
}
