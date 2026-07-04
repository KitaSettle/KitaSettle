import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DiscoveryInterviewSession,
  ExecutiveDNAFieldConfidence,
  ExecutiveDNAFieldKey,
  ExecutiveDNAInference,
  ExecutiveDNAProfile,
  ExecutiveDNAProfileData,
  ExecutiveDNAProfileVersion,
  ExecutiveDNALearningEvent,
  ExecutiveDNALearningSource,
  ExecutiveDNARecommendation,
} from "@/lib/types/executive-dna";
import {
  createEmptyExecutiveDNAProfile,
  DISCOVERY_CONFIDENCE_TARGET,
  EXECUTIVE_DNA_FIELDS,
} from "@/lib/types/executive-dna";
import { nowIso } from "@/lib/utils";

export interface ExecutiveDNARepository {
  getProfile(userId: string): Promise<ExecutiveDNAProfile | null>;
  ensureProfile(userId: string): Promise<ExecutiveDNAProfile>;
  updateProfileField(
    userId: string,
    fieldKey: ExecutiveDNAFieldKey,
    value: unknown,
    confidence: number,
    source: ExecutiveDNALearningSource,
    reason: string,
  ): Promise<ExecutiveDNAProfile>;
  recordLearningEvent(
    userId: string,
    event: Omit<ExecutiveDNALearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void>;
  saveProfileVersion(
    userId: string,
    profile: ExecutiveDNAProfileData,
    overallConfidence: number,
    changeReason: string,
  ): Promise<ExecutiveDNAProfileVersion>;
  getLearningHistory(userId: string, limit?: number): Promise<ExecutiveDNALearningEvent[]>;
  getProfileVersions(userId: string, limit?: number): Promise<ExecutiveDNAProfileVersion[]>;
  saveInferences(userId: string, inferences: Omit<ExecutiveDNAInference, "id" | "userId" | "updatedAt">[]): Promise<void>;
  getInferences(userId: string): Promise<ExecutiveDNAInference[]>;
  saveRecommendations(
    userId: string,
    recommendations: Omit<ExecutiveDNARecommendation, "id" | "createdAt" | "dismissed">[],
  ): Promise<ExecutiveDNARecommendation[]>;
  getRecommendations(userId: string): Promise<ExecutiveDNARecommendation[]>;
  dismissRecommendation(userId: string, id: string): Promise<void>;
  getInterviewSession(userId: string): Promise<DiscoveryInterviewSession | null>;
  saveInterviewSession(session: DiscoveryInterviewSession): Promise<DiscoveryInterviewSession>;
  markInterviewComplete(userId: string): Promise<ExecutiveDNAProfile>;
}

function parseProfile(value: unknown): ExecutiveDNAProfileData {
  const empty = createEmptyExecutiveDNAProfile();
  if (!value || typeof value !== "object") return empty;
  const raw = value as Partial<ExecutiveDNAProfileData>;
  return {
    ...empty,
    ...raw,
    responsibilities: raw.responsibilities ?? empty.responsibilities,
    goals: raw.goals ?? empty.goals,
    currentProjects: raw.currentProjects ?? empty.currentProjects,
    researchInterests: raw.researchInterests ?? empty.researchInterests,
    learningInterests: raw.learningInterests ?? empty.learningInterests,
    importantTopics: raw.importantTopics ?? empty.importantTopics,
    focusAreas: raw.focusAreas ?? empty.focusAreas,
    confidenceThreshold: raw.confidenceThreshold ?? empty.confidenceThreshold,
  };
}

function computeOverallConfidence(fields: ExecutiveDNAFieldConfidence[]): number {
  const active = fields.filter((field) => field.confidence > 0);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, field) => sum + field.confidence, 0);
  return Math.round(total / active.length);
}

export class SupabaseExecutiveDNARepository implements ExecutiveDNARepository {
  constructor(private client: SupabaseClient) {}

  async getProfile(userId: string): Promise<ExecutiveDNAProfile | null> {
    const { data, error } = await this.client
      .from("executive_dna_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const { data: confidenceRows, error: confidenceError } = await this.client
      .from("executive_dna_field_confidence")
      .select("*")
      .eq("user_id", userId);

    if (confidenceError) throw confidenceError;

    const fieldConfidence = (confidenceRows ?? []).map((row) => ({
      fieldKey: row.field_key as ExecutiveDNAFieldKey,
      confidence: Number(row.confidence),
      value: row.value,
      updatedAt: row.updated_at as string,
    }));

    return {
      id: data.id as string,
      userId,
      profile: parseProfile(data.profile),
      fieldConfidence,
      overallConfidence: Number(data.overall_confidence),
      interviewComplete: Boolean(data.interview_complete),
      version: Number(data.version),
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  async ensureProfile(userId: string): Promise<ExecutiveDNAProfile> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;

    const profile = createEmptyExecutiveDNAProfile();
    const { data, error } = await this.client
      .from("executive_dna_profiles")
      .insert({
        user_id: userId,
        profile,
        overall_confidence: 0,
        interview_complete: false,
        version: 1,
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      id: data.id as string,
      userId,
      profile,
      fieldConfidence: [],
      overallConfidence: 0,
      interviewComplete: false,
      version: 1,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  async updateProfileField(
    userId: string,
    fieldKey: ExecutiveDNAFieldKey,
    value: unknown,
    confidence: number,
    source: ExecutiveDNALearningSource,
    reason: string,
  ): Promise<ExecutiveDNAProfile> {
    const current = await this.ensureProfile(userId);
    const previousValue = (current.profile as unknown as Record<string, unknown>)[fieldKey];
    const previousConfidence =
      current.fieldConfidence.find((field) => field.fieldKey === fieldKey)?.confidence ?? 0;

    const mergedConfidence = Math.min(
      100,
      Math.max(previousConfidence, confidence, previousConfidence + 5),
    );

    const nextProfile = {
      ...current.profile,
      [fieldKey]: value,
    } as ExecutiveDNAProfileData;

    await this.client.from("executive_dna_field_confidence").upsert(
      {
        user_id: userId,
        field_key: fieldKey,
        confidence: mergedConfidence,
        value,
        updated_at: nowIso(),
      },
      { onConflict: "user_id,field_key" },
    );

    const nextFieldConfidence = EXECUTIVE_DNA_FIELDS.map((key) => {
      const existing = current.fieldConfidence.find((field) => field.fieldKey === key);
      if (key === fieldKey) {
        return {
          fieldKey,
          confidence: mergedConfidence,
          value,
          updatedAt: nowIso(),
        };
      }
      return (
        existing ?? {
          fieldKey: key,
          confidence: 0,
          value: (nextProfile as unknown as Record<string, unknown>)[key],
          updatedAt: nowIso(),
        }
      );
    });

    const overallConfidence = computeOverallConfidence(nextFieldConfidence);
    const interviewComplete = overallConfidence >= DISCOVERY_CONFIDENCE_TARGET;
    const nextVersion = interviewComplete && !current.interviewComplete
      ? current.version + 1
      : current.version;

    const { error } = await this.client
      .from("executive_dna_profiles")
      .update({
        profile: nextProfile,
        overall_confidence: overallConfidence,
        interview_complete: interviewComplete,
        version: nextVersion,
        updated_at: nowIso(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    await this.recordLearningEvent(userId, {
      fieldKey,
      previousValue,
      newValue: value,
      confidenceBefore: previousConfidence,
      confidenceAfter: mergedConfidence,
      source,
      reason,
    });

    if (nextVersion !== current.version) {
      await this.saveProfileVersion(userId, nextProfile, overallConfidence, reason);
    }

    return {
      ...current,
      profile: nextProfile,
      fieldConfidence: nextFieldConfidence,
      overallConfidence,
      interviewComplete,
      version: nextVersion,
      updatedAt: nowIso(),
    };
  }

  async recordLearningEvent(
    userId: string,
    event: Omit<ExecutiveDNALearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void> {
    const { error } = await this.client.from("executive_dna_learning_events").insert({
      user_id: userId,
      field_key: event.fieldKey,
      previous_value: event.previousValue ?? null,
      new_value: event.newValue ?? null,
      confidence_before: event.confidenceBefore,
      confidence_after: event.confidenceAfter,
      source: event.source,
      reason: event.reason,
    });

    if (error) throw error;
  }

  async saveProfileVersion(
    userId: string,
    profile: ExecutiveDNAProfileData,
    overallConfidence: number,
    changeReason: string,
  ): Promise<ExecutiveDNAProfileVersion> {
    const current = await this.ensureProfile(userId);
    const { data, error } = await this.client
      .from("executive_dna_profile_versions")
      .insert({
        user_id: userId,
        version: current.version,
        profile,
        overall_confidence: overallConfidence,
        change_reason: changeReason,
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      id: data.id as string,
      userId,
      version: Number(data.version),
      profile: parseProfile(data.profile),
      overallConfidence: Number(data.overall_confidence),
      changeReason: data.change_reason as string,
      createdAt: data.created_at as string,
    };
  }

  async getLearningHistory(userId: string, limit = 50): Promise<ExecutiveDNALearningEvent[]> {
    const { data, error } = await this.client
      .from("executive_dna_learning_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      fieldKey: row.field_key as string,
      previousValue: row.previous_value,
      newValue: row.new_value,
      confidenceBefore: Number(row.confidence_before),
      confidenceAfter: Number(row.confidence_after),
      source: row.source as ExecutiveDNALearningSource,
      reason: row.reason as string,
      createdAt: row.created_at as string,
    }));
  }

  async getProfileVersions(userId: string, limit = 20): Promise<ExecutiveDNAProfileVersion[]> {
    const { data, error } = await this.client
      .from("executive_dna_profile_versions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      version: Number(row.version),
      profile: parseProfile(row.profile),
      overallConfidence: Number(row.overall_confidence),
      changeReason: row.change_reason as string,
      createdAt: row.created_at as string,
    }));
  }

  async saveInferences(
    userId: string,
    inferences: Omit<ExecutiveDNAInference, "id" | "userId" | "updatedAt">[],
  ): Promise<void> {
    if (inferences.length === 0) return;

    const rows = inferences.map((item) => ({
      user_id: userId,
      inference_type: item.inferenceType,
      payload: item.payload,
      confidence: item.confidence,
      updated_at: nowIso(),
    }));

    const types = inferences.map((item) => item.inferenceType);
    const { error: deleteError } = await this.client
      .from("executive_dna_inferences")
      .delete()
      .eq("user_id", userId)
      .in("inference_type", types);

    if (deleteError) throw deleteError;

    const { error: insertError } = await this.client.from("executive_dna_inferences").insert(rows);
    if (insertError) throw insertError;
  }

  async getInferences(userId: string): Promise<ExecutiveDNAInference[]> {
    const { data, error } = await this.client
      .from("executive_dna_inferences")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      inferenceType: row.inference_type as ExecutiveDNAInference["inferenceType"],
      payload: row.payload as Record<string, unknown>,
      confidence: Number(row.confidence),
      updatedAt: row.updated_at as string,
    }));
  }

  async saveRecommendations(
    userId: string,
    recommendations: Omit<ExecutiveDNARecommendation, "id" | "createdAt" | "dismissed">[],
  ): Promise<ExecutiveDNARecommendation[]> {
    const rows = recommendations.map((item) => ({
      user_id: userId,
      recommendation: item.recommendation,
      category: item.category,
      priority: item.priority,
      dismissed: false,
      updated_at: nowIso(),
    }));

    const { data, error } = await this.client
      .from("executive_dna_recommendations")
      .insert(rows)
      .select("*");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      recommendation: row.recommendation as string,
      category: row.category as string,
      priority: Number(row.priority),
      dismissed: Boolean(row.dismissed),
      createdAt: row.created_at as string,
    }));
  }

  async getRecommendations(userId: string): Promise<ExecutiveDNARecommendation[]> {
    const { data, error } = await this.client
      .from("executive_dna_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .order("priority", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      recommendation: row.recommendation as string,
      category: row.category as string,
      priority: Number(row.priority),
      dismissed: Boolean(row.dismissed),
      createdAt: row.created_at as string,
    }));
  }

  async dismissRecommendation(userId: string, id: string): Promise<void> {
    const { error } = await this.client
      .from("executive_dna_recommendations")
      .update({ dismissed: true, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
  }

  async getInterviewSession(userId: string): Promise<DiscoveryInterviewSession | null> {
    const { data, error } = await this.client
      .from("executive_dna_interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id as string,
      userId,
      messages: (data.messages ?? []) as DiscoveryInterviewSession["messages"],
      overallConfidence: Number(data.overall_confidence),
      isComplete: Boolean(data.is_complete),
      updatedAt: data.updated_at as string,
    };
  }

  async saveInterviewSession(session: DiscoveryInterviewSession): Promise<DiscoveryInterviewSession> {
    const { data, error } = await this.client
      .from("executive_dna_interview_sessions")
      .upsert({
        id: session.id,
        user_id: session.userId,
        messages: session.messages,
        overall_confidence: session.overallConfidence,
        is_complete: session.isComplete,
        updated_at: nowIso(),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      id: data.id as string,
      userId: session.userId,
      messages: (data.messages ?? []) as DiscoveryInterviewSession["messages"],
      overallConfidence: Number(data.overall_confidence),
      isComplete: Boolean(data.is_complete),
      updatedAt: data.updated_at as string,
    };
  }

  async markInterviewComplete(userId: string): Promise<ExecutiveDNAProfile> {
    const current = await this.ensureProfile(userId);
    const nextVersion = current.interviewComplete ? current.version : current.version + 1;

    const { error } = await this.client
      .from("executive_dna_profiles")
      .update({
        interview_complete: true,
        version: nextVersion,
        updated_at: nowIso(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    return {
      ...current,
      interviewComplete: true,
      version: nextVersion,
      updatedAt: nowIso(),
    };
  }
}
