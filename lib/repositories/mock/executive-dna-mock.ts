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
import { createId, nowIso } from "@/lib/utils";
import type { ExecutiveDNARepository } from "../executive-dna-repository";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function computeOverallConfidence(fields: ExecutiveDNAFieldConfidence[]): number {
  const active = fields.filter((field) => field.confidence > 0);
  if (active.length === 0) return 0;
  const total = active.reduce((sum, field) => sum + field.confidence, 0);
  return Math.round(total / active.length);
}

export class MockExecutiveDNARepository implements ExecutiveDNARepository {
  private profiles = new Map<string, ExecutiveDNAProfile>();
  private learningEvents = new Map<string, ExecutiveDNALearningEvent[]>();
  private versions = new Map<string, ExecutiveDNAProfileVersion[]>();
  private inferences = new Map<string, ExecutiveDNAInference[]>();
  private recommendations = new Map<string, ExecutiveDNARecommendation[]>();
  private sessions = new Map<string, DiscoveryInterviewSession>();

  async getProfile(userId: string): Promise<ExecutiveDNAProfile | null> {
    const profile = this.profiles.get(userId);
    return profile ? clone(profile) : null;
  }

  async ensureProfile(userId: string): Promise<ExecutiveDNAProfile> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;

    const created: ExecutiveDNAProfile = {
      id: createId("dna"),
      userId,
      profile: createEmptyExecutiveDNAProfile(),
      fieldConfidence: [],
      overallConfidence: 0,
      interviewComplete: false,
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.profiles.set(userId, created);
    return clone(created);
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
    const nextVersion =
      interviewComplete && !current.interviewComplete ? current.version + 1 : current.version;

    const updated: ExecutiveDNAProfile = {
      ...current,
      profile: nextProfile,
      fieldConfidence: nextFieldConfidence,
      overallConfidence,
      interviewComplete,
      version: nextVersion,
      updatedAt: nowIso(),
    };

    this.profiles.set(userId, updated);

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

    return clone(updated);
  }

  async recordLearningEvent(
    userId: string,
    event: Omit<ExecutiveDNALearningEvent, "id" | "userId" | "createdAt">,
  ): Promise<void> {
    const created: ExecutiveDNALearningEvent = {
      ...event,
      id: createId("learn"),
      userId,
      createdAt: nowIso(),
    };
    const events = this.learningEvents.get(userId) ?? [];
    events.unshift(created);
    this.learningEvents.set(userId, events);
  }

  async saveProfileVersion(
    userId: string,
    profile: ExecutiveDNAProfileData,
    overallConfidence: number,
    changeReason: string,
  ): Promise<ExecutiveDNAProfileVersion> {
    const current = await this.ensureProfile(userId);
    const version: ExecutiveDNAProfileVersion = {
      id: createId("version"),
      userId,
      version: current.version,
      profile: clone(profile),
      overallConfidence,
      changeReason,
      createdAt: nowIso(),
    };
    const versions = this.versions.get(userId) ?? [];
    versions.unshift(version);
    this.versions.set(userId, versions);
    return clone(version);
  }

  async getLearningHistory(userId: string, limit = 50): Promise<ExecutiveDNALearningEvent[]> {
    return clone((this.learningEvents.get(userId) ?? []).slice(0, limit));
  }

  async getProfileVersions(userId: string, limit = 20): Promise<ExecutiveDNAProfileVersion[]> {
    return clone((this.versions.get(userId) ?? []).slice(0, limit));
  }

  async saveInferences(
    userId: string,
    inferences: Omit<ExecutiveDNAInference, "id" | "userId" | "updatedAt">[],
  ): Promise<void> {
    const saved = inferences.map((item) => ({
      ...item,
      id: createId("infer"),
      userId,
      updatedAt: nowIso(),
    }));
    this.inferences.set(userId, saved);
  }

  async getInferences(userId: string): Promise<ExecutiveDNAInference[]> {
    return clone(this.inferences.get(userId) ?? []);
  }

  async saveRecommendations(
    userId: string,
    recommendations: Omit<ExecutiveDNARecommendation, "id" | "createdAt" | "dismissed">[],
  ): Promise<ExecutiveDNARecommendation[]> {
    const saved = recommendations.map((item) => ({
      ...item,
      id: createId("rec"),
      dismissed: false,
      createdAt: nowIso(),
    }));
    this.recommendations.set(userId, saved);
    return clone(saved);
  }

  async getRecommendations(userId: string): Promise<ExecutiveDNARecommendation[]> {
    return clone((this.recommendations.get(userId) ?? []).filter((item) => !item.dismissed));
  }

  async dismissRecommendation(userId: string, id: string): Promise<void> {
    const items = this.recommendations.get(userId) ?? [];
    this.recommendations.set(
      userId,
      items.map((item) => (item.id === id ? { ...item, dismissed: true } : item)),
    );
  }

  async getInterviewSession(userId: string): Promise<DiscoveryInterviewSession | null> {
    const session = this.sessions.get(userId);
    return session ? clone(session) : null;
  }

  async saveInterviewSession(session: DiscoveryInterviewSession): Promise<DiscoveryInterviewSession> {
    const saved = { ...session, updatedAt: nowIso() };
    this.sessions.set(session.userId, saved);
    return clone(saved);
  }
}
