import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbExecutiveBrief } from "@/lib/database/types";
import type {
  Decision,
  ExecutiveBrief,
  Opportunity,
  PreparedItem,
  Priority,
  Risk,
} from "@/lib/types/ui";
import type {
  AIExecutiveBriefOutput,
  ExecutiveBriefHistoryEntry,
} from "@/lib/ai/types";

export interface ExecutiveBriefRepository {
  getActive(userId: string): Promise<ExecutiveBrief | null>;
  getAll(userId: string): Promise<ExecutiveBrief[]>;
  getById(userId: string, id: string): Promise<ExecutiveBrief | null>;
  create(userId: string, brief: ExecutiveBrief): Promise<ExecutiveBrief>;
  update(userId: string, id: string, brief: Partial<ExecutiveBrief>): Promise<ExecutiveBrief | null>;
  saveGenerated(userId: string, brief: AIExecutiveBriefOutput): Promise<void>;
  getHistory(userId: string): Promise<ExecutiveBriefHistoryEntry[]>;
}

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

export function mapBriefRow(row: DbExecutiveBrief): ExecutiveBrief {
  return {
    summary: row.summary,
    confidenceScore: row.confidence_score,
    recommendedFocus: row.recommended_focus,
    priorities: parseJsonArray<Priority>(row.priorities),
    decisions: parseJsonArray<Decision>(row.decisions),
    risks: parseJsonArray<Risk>(row.risks),
    opportunities: parseJsonArray<Opportunity>(row.opportunities),
    aiPrepared: parseJsonArray<PreparedItem>(row.ai_prepared),
    workloadEstimate: row.workload_estimate,
  };
}

export class SupabaseExecutiveBriefRepository implements ExecutiveBriefRepository {
  constructor(private client: SupabaseClient) {}

  async getActive(userId: string): Promise<ExecutiveBrief | null> {
    const { data, error } = await this.client
      .from("executive_briefs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapBriefRow(data as DbExecutiveBrief) : null;
  }

  async getAll(userId: string): Promise<ExecutiveBrief[]> {
    const { data, error } = await this.client
      .from("executive_briefs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data as DbExecutiveBrief[]).map(mapBriefRow);
  }

  async getById(userId: string, id: string): Promise<ExecutiveBrief | null> {
    const { data, error } = await this.client
      .from("executive_briefs")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapBriefRow(data as DbExecutiveBrief) : null;
  }

  async create(userId: string, brief: ExecutiveBrief): Promise<ExecutiveBrief> {
    await this.client
      .from("executive_briefs")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    const { data, error } = await this.client
      .from("executive_briefs")
      .insert({
        user_id: userId,
        summary: brief.summary,
        confidence_score: brief.confidenceScore,
        recommended_focus: brief.recommendedFocus,
        priorities: brief.priorities,
        decisions: brief.decisions,
        risks: brief.risks,
        opportunities: brief.opportunities,
        ai_prepared: brief.aiPrepared,
        workload_estimate: brief.workloadEstimate,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapBriefRow(data as DbExecutiveBrief);
  }

  async update(
    userId: string,
    id: string,
    brief: Partial<ExecutiveBrief>,
  ): Promise<ExecutiveBrief | null> {
    const existing = await this.getById(userId, id);
    if (!existing) return null;

    const merged = { ...existing, ...brief };
    const { data, error } = await this.client
      .from("executive_briefs")
      .update({
        summary: merged.summary,
        confidence_score: merged.confidenceScore,
        recommended_focus: merged.recommendedFocus,
        priorities: merged.priorities,
        decisions: merged.decisions,
        risks: merged.risks,
        opportunities: merged.opportunities,
        ai_prepared: merged.aiPrepared,
        workload_estimate: merged.workloadEstimate,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapBriefRow(data as DbExecutiveBrief) : null;
  }

  async saveGenerated(userId: string, brief: AIExecutiveBriefOutput): Promise<void> {
    await this.client
      .from("executive_briefs")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    const { error } = await this.client.from("executive_briefs").insert({
      user_id: userId,
      summary: brief.executiveSummary,
      confidence_score: brief.confidence,
      recommended_focus: brief.recommendedActions[0] ?? "Review priorities",
      priorities: brief.topPriorities.map((title, index) => ({
        id: `p-${index + 1}`,
        title,
      })),
      decisions: [],
      risks: brief.risks.map((title, index) => ({ id: `r-${index + 1}`, title })),
      opportunities: brief.opportunities.map((title, index) => ({
        id: `o-${index + 1}`,
        title,
      })),
      ai_prepared: [],
      workload_estimate: brief.estimatedReadingSaved,
      is_active: true,
    });

    if (error) throw error;
  }

  async getHistory(userId: string): Promise<ExecutiveBriefHistoryEntry[]> {
    const { data, error } = await this.client
      .from("executive_briefs")
      .select("id, summary, confidence_score, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      headline: row.summary as string,
      timestamp: row.updated_at as string,
      topicsUsed: [],
      confidence: row.confidence_score as number,
      estimatedReadingSaved: "",
    }));
  }
}
