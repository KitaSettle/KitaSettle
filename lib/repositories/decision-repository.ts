import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DecisionCandidate,
  DecisionFactorWeights,
  DecisionInputSource,
  DecisionItem,
  DecisionLearningEvent,
  DecisionLearningEventType,
  DecisionStatus,
} from "@/lib/types/decision-engine";
import { DEFAULT_DECISION_WEIGHTS } from "@/lib/types/decision-engine";
import { nowIso } from "@/lib/utils";

export interface DecisionRepository {
  getWeights(userId: string): Promise<DecisionFactorWeights>;
  saveWeights(userId: string, weights: DecisionFactorWeights): Promise<void>;
  upsertDecisions(userId: string, items: DecisionItem[]): Promise<void>;
  listForDate(userId: string, date: string): Promise<DecisionItem[]>;
  listPending(userId: string, date?: string): Promise<DecisionItem[]>;
  updateStatus(userId: string, id: string, status: DecisionStatus): Promise<DecisionItem | null>;
  recordLearningEvent(
    userId: string,
    event: Omit<DecisionLearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void>;
  getLearningHistory(userId: string, limit?: number): Promise<DecisionLearningEvent[]>;
}

function mapFactors(row: Record<string, unknown>) {
  return {
    impact: Number(row.impact ?? 0),
    urgency: Number(row.urgency ?? 0),
    risk: Number(row.risk ?? 0),
    confidence: Number(row.confidence ?? 0),
    dependencies: Number(row.dependencies ?? 0),
    estimatedTime: Number(row.estimated_time ?? 0),
    energyRequired: Number(row.energy_required ?? 0),
    financialEffect: Number(row.financial_effect ?? 0),
    strategicImportance: Number(row.strategic_importance ?? 0),
  };
}

function mapDecision(row: Record<string, unknown>): DecisionItem {
  const factors = mapFactors(row);
  return {
    id: row.id as string,
    userId: row.user_id as string,
    externalKey: row.external_key as string,
    title: row.title as string,
    actionLabel: row.action_label as string,
    source: row.source as DecisionInputSource,
    sourceRef: (row.source_ref as string | null) ?? null,
    factors,
    score: Number(row.score ?? 0),
    confidence: Number(row.confidence ?? factors.confidence),
    explanation: String(row.explanation ?? ""),
    because: (row.because ?? []) as string[],
    status: row.status as DecisionStatus,
    queuedFor: row.queued_for as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SupabaseDecisionRepository implements DecisionRepository {
  constructor(private client: SupabaseClient) {}

  async getWeights(userId: string): Promise<DecisionFactorWeights> {
    const { data, error } = await this.client
      .from("decision_weight_profiles")
      .select("weights")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.weights) return { ...DEFAULT_DECISION_WEIGHTS };
    return { ...DEFAULT_DECISION_WEIGHTS, ...(data.weights as DecisionFactorWeights) };
  }

  async saveWeights(userId: string, weights: DecisionFactorWeights): Promise<void> {
    const { error } = await this.client.from("decision_weight_profiles").upsert({
      user_id: userId,
      weights,
      updated_at: nowIso(),
    });
    if (error) throw error;
  }

  async upsertDecisions(userId: string, items: DecisionItem[]): Promise<void> {
    if (items.length === 0) return;

    const rows = items.map((item) => ({
      id: item.id,
      user_id: userId,
      external_key: item.externalKey,
      title: item.title,
      action_label: item.actionLabel,
      source: item.source,
      source_ref: item.sourceRef,
      impact: item.factors.impact,
      urgency: item.factors.urgency,
      risk: item.factors.risk,
      confidence: item.confidence,
      dependencies: item.factors.dependencies,
      estimated_time: item.factors.estimatedTime,
      energy_required: item.factors.energyRequired,
      financial_effect: item.factors.financialEffect,
      strategic_importance: item.factors.strategicImportance,
      score: item.score,
      explanation: item.explanation,
      because: item.because,
      status: item.status,
      queued_for: item.queuedFor,
      metadata: item.metadata,
      updated_at: nowIso(),
    }));

    const { error } = await this.client
      .from("decision_items")
      .upsert(rows, { onConflict: "user_id,external_key,queued_for" });
    if (error) throw error;
  }

  async listForDate(userId: string, date: string): Promise<DecisionItem[]> {
    const { data, error } = await this.client
      .from("decision_items")
      .select("*")
      .eq("user_id", userId)
      .eq("queued_for", date)
      .order("score", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapDecision);
  }

  async listPending(userId: string, date?: string): Promise<DecisionItem[]> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await this.client
      .from("decision_items")
      .select("*")
      .eq("user_id", userId)
      .eq("queued_for", targetDate)
      .eq("status", "pending")
      .order("score", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapDecision);
  }

  async updateStatus(userId: string, id: string, status: DecisionStatus): Promise<DecisionItem | null> {
    const { data, error } = await this.client
      .from("decision_items")
      .update({ status, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapDecision(data) : null;
  }

  async recordLearningEvent(
    userId: string,
    event: Omit<DecisionLearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void> {
    const { error } = await this.client.from("decision_learning_events").insert({
      user_id: userId,
      decision_id: event.decisionId,
      external_key: event.externalKey,
      event_type: event.eventType,
      source: event.source,
      score_before: event.scoreBefore,
      weight_adjustments: event.weightAdjustments,
      reason: event.reason,
    });
    if (error) throw error;
  }

  async getLearningHistory(userId: string, limit = 50): Promise<DecisionLearningEvent[]> {
    const { data, error } = await this.client
      .from("decision_learning_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      decisionId: (row.decision_id as string | null) ?? null,
      externalKey: (row.external_key as string | null) ?? null,
      eventType: row.event_type as DecisionLearningEventType,
      source: (row.source as DecisionInputSource | null) ?? null,
      scoreBefore: row.score_before != null ? Number(row.score_before) : null,
      weightAdjustments: (row.weight_adjustments ?? {}) as Partial<DecisionFactorWeights>,
      reason: row.reason as string,
      createdAt: row.created_at as string,
    }));
  }
}

export type { DecisionCandidate };
