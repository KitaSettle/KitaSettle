import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IntakeAnalysis,
  IntakeProcessingStatus,
  IntakeRecord,
  IntakeSourceType,
} from "@/lib/types/intake";
import type { EntityId } from "@/lib/types/common";
import { createId, nowIso } from "@/lib/utils";

export interface IntakeRepository {
  create(
    userId: string,
    item: Omit<IntakeRecord, "id" | "userId" | "createdAt">,
  ): Promise<IntakeRecord>;
  list(userId: string, limit?: number): Promise<IntakeRecord[]>;
  getById(userId: string, id: EntityId): Promise<IntakeRecord | null>;
}

function mapAnalysis(value: unknown): IntakeAnalysis {
  const row = (value ?? {}) as Partial<IntakeAnalysis>;
  return {
    title: String(row.title ?? "Delegated item"),
    summary: String(row.summary ?? ""),
    category: String(row.category ?? "Intake"),
    subcategory: String(row.subcategory ?? "Delegation"),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    overallConfidence: Number(row.overallConfidence ?? 70),
    professionRelevance: String(row.professionRelevance ?? ""),
    projects: Array.isArray(row.projects) ? row.projects : [],
    people: Array.isArray(row.people) ? row.people : [],
    deadlines: Array.isArray(row.deadlines) ? row.deadlines : [],
    risks: Array.isArray(row.risks) ? row.risks : [],
    opportunities: Array.isArray(row.opportunities) ? row.opportunities : [],
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    reminders: Array.isArray(row.reminders) ? row.reminders : [],
    relatedDocumentHints: Array.isArray(row.relatedDocumentHints)
      ? row.relatedDocumentHints.map(String)
      : [],
    needsUserClarification: Boolean(row.needsUserClarification),
    clarificationQuestions: Array.isArray(row.clarificationQuestions)
      ? row.clarificationQuestions.map(String)
      : [],
  };
}

function mapIntake(row: Record<string, unknown>): IntakeRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sourceType: row.source_type as IntakeSourceType,
    sourceLabel: row.source_label as string,
    mimeType: (row.mime_type as string | null) ?? null,
    contentPreview: String(row.content_preview ?? ""),
    analysis: mapAnalysis(row.analysis),
    status: row.status as IntakeProcessingStatus,
    knowledgeId: (row.knowledge_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export class SupabaseIntakeRepository implements IntakeRepository {
  constructor(private client: SupabaseClient) {}

  async create(
    userId: string,
    item: Omit<IntakeRecord, "id" | "userId" | "createdAt">,
  ): Promise<IntakeRecord> {
    const id = createId("intake");
    const { data, error } = await this.client
      .from("intake_items")
      .insert({
        id,
        user_id: userId,
        source_type: item.sourceType,
        source_label: item.sourceLabel,
        mime_type: item.mimeType,
        content_preview: item.contentPreview.slice(0, 4000),
        analysis: item.analysis,
        status: item.status,
        knowledge_id: item.knowledgeId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapIntake(data);
  }

  async list(userId: string, limit = 20): Promise<IntakeRecord[]> {
    const { data, error } = await this.client
      .from("intake_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapIntake);
  }

  async getById(userId: string, id: EntityId): Promise<IntakeRecord | null> {
    const { data, error } = await this.client
      .from("intake_items")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapIntake(data) : null;
  }
}

export class MockIntakeRepository implements IntakeRepository {
  private items = new Map<string, IntakeRecord[]>();

  async create(
    userId: string,
    item: Omit<IntakeRecord, "id" | "userId" | "createdAt">,
  ): Promise<IntakeRecord> {
    const created: IntakeRecord = {
      ...item,
      id: createId("intake"),
      userId,
      createdAt: nowIso(),
    };
    const bucket = this.items.get(userId) ?? [];
    bucket.unshift(created);
    this.items.set(userId, bucket);
    return created;
  }

  async list(userId: string, limit = 20): Promise<IntakeRecord[]> {
    return (this.items.get(userId) ?? []).slice(0, limit);
  }

  async getById(userId: string, id: EntityId): Promise<IntakeRecord | null> {
    return (this.items.get(userId) ?? []).find((item) => item.id === id) ?? null;
  }
}
