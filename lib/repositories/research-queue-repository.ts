import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbResearchQueue } from "@/lib/database/types";
import type {
  ResearchQueueRecord,
  ResearchQueueStatus,
} from "@/lib/types/research";
import type { EntityId } from "@/lib/types/common";

export interface ResearchQueueRepository {
  list(userId: string): Promise<ResearchQueueRecord[]>;
  getById(userId: string, id: EntityId): Promise<ResearchQueueRecord | null>;
  listByStatus(userId: string, status: ResearchQueueStatus): Promise<ResearchQueueRecord[]>;
  listPending(userId: string): Promise<ResearchQueueRecord[]>;
  enqueue(
    userId: string,
    item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">,
  ): Promise<ResearchQueueRecord>;
  updateStatus(
    userId: string,
    id: EntityId,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord | null>;
  approve(userId: string, id: EntityId): Promise<ResearchQueueRecord | null>;
  reject(userId: string, id: EntityId): Promise<ResearchQueueRecord | null>;
}

export function mapResearchQueueRow(row: DbResearchQueue): ResearchQueueRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    source: row.source,
    sourceUrl: row.source_url,
    confidence: row.confidence,
    importance: row.importance,
    whyItMatters: row.why_it_matters,
    status: row.status as ResearchQueueStatus,
    tags: row.tags,
    queuedAt: row.queued_at,
    updatedAt: row.updated_at,
  };
}

const PENDING_STATUSES: ResearchQueueStatus[] = [
  "Queued",
  "Searching",
  "Analysing",
  "Ready",
];

export class SupabaseResearchQueueRepository implements ResearchQueueRepository {
  constructor(private client: SupabaseClient) {}

  async list(userId: string): Promise<ResearchQueueRecord[]> {
    const { data, error } = await this.client
      .from("research_queue")
      .select("*")
      .eq("user_id", userId)
      .order("queued_at", { ascending: false });

    if (error) throw error;
    return (data as DbResearchQueue[]).map(mapResearchQueueRow);
  }

  async getById(userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    const { data, error } = await this.client
      .from("research_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapResearchQueueRow(data as DbResearchQueue) : null;
  }

  async listByStatus(
    userId: string,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord[]> {
    const { data, error } = await this.client
      .from("research_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("queued_at", { ascending: false });

    if (error) throw error;
    return (data as DbResearchQueue[]).map(mapResearchQueueRow);
  }

  async listPending(userId: string): Promise<ResearchQueueRecord[]> {
    const { data, error } = await this.client
      .from("research_queue")
      .select("*")
      .eq("user_id", userId)
      .in("status", PENDING_STATUSES)
      .order("queued_at", { ascending: false });

    if (error) throw error;
    return (data as DbResearchQueue[]).map(mapResearchQueueRow);
  }

  async enqueue(
    userId: string,
    item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">,
  ): Promise<ResearchQueueRecord> {
    const { data, error } = await this.client
      .from("research_queue")
      .insert({
        user_id: userId,
        title: item.title,
        summary: item.summary,
        source: item.source,
        source_url: item.sourceUrl,
        confidence: item.confidence,
        importance: item.importance,
        why_it_matters: item.whyItMatters,
        status: "Queued",
        tags: item.tags,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapResearchQueueRow(data as DbResearchQueue);
  }

  async updateStatus(
    userId: string,
    id: EntityId,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord | null> {
    const { data, error } = await this.client
      .from("research_queue")
      .update({ status })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapResearchQueueRow(data as DbResearchQueue) : null;
  }

  async approve(userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(userId, id, "Approved");
  }

  async reject(userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(userId, id, "Rejected");
  }
}
