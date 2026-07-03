import type { DbTrustedSource } from "@/lib/database/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STATIC_TRUSTED_SOURCES } from "@/lib/executive-brain/static-config";

export interface TrustedSource {
  id: string;
  name: string;
  category: string;
  description: string;
  searchTags: string[];
}

export interface TrustedSourceRepository {
  /** Sources the user has explicitly added — never the global catalog. */
  listForUser(userId: string): Promise<TrustedSource[]>;
  /** Global catalog for browse/add flows. */
  listCatalog(): Promise<TrustedSource[]>;
  getById(id: string): Promise<TrustedSource | null>;
}

export function mapTrustedSourceRow(row: DbTrustedSource): TrustedSource {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    searchTags: row.search_tags,
  };
}

export class SupabaseTrustedSourceRepository implements TrustedSourceRepository {
  constructor(private client: SupabaseClient) {}

  async listForUser(_userId: string): Promise<TrustedSource[]> {
    // Per-user subscriptions are added during onboarding or settings; new users start empty.
    return [];
  }

  async listCatalog(): Promise<TrustedSource[]> {
    const { data, error } = await this.client
      .from("trusted_sources")
      .select("*")
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as DbTrustedSource[]).map(mapTrustedSourceRow);
  }

  async getById(id: string): Promise<TrustedSource | null> {
    const { data, error } = await this.client
      .from("trusted_sources")
      .select("*")
      .eq("id", id)
      .eq("enabled", true)
      .maybeSingle();

    if (error) throw error;
    return data ? mapTrustedSourceRow(data as DbTrustedSource) : null;
  }
}

export class MockTrustedSourceRepository implements TrustedSourceRepository {
  async listForUser(_userId: string): Promise<TrustedSource[]> {
    return [];
  }

  async listCatalog(): Promise<TrustedSource[]> {
    return STATIC_TRUSTED_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      category: source.category,
      description: source.description,
      searchTags: [...source.searchTags],
    }));
  }

  async getById(id: string): Promise<TrustedSource | null> {
    const sources = await this.listCatalog();
    return sources.find((source) => source.id === id) ?? null;
  }
}
