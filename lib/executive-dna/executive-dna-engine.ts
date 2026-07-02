import type { Repositories } from "@/lib/repositories";
import type {
  ExecutiveDNAFieldKey,
  ExecutiveDNAProfile,
  ExecutiveDNAStatus,
} from "@/lib/types/executive-dna";
import { DISCOVERY_CONFIDENCE_TARGET } from "@/lib/types/executive-dna";
import { DiscoveryInterviewService } from "./discovery-interview-service";
import { ExecutiveInferenceService } from "./executive-inference-service";
import { ExecutiveLearningService } from "./executive-learning-service";
import { ExecutivePersonalizationService } from "./executive-personalization-service";
import { ExecutiveRecommendationService } from "./executive-recommendation-service";

export class ExecutiveDNAEngine {
  private learning: ExecutiveLearningService;
  private interview: DiscoveryInterviewService;
  private inference: ExecutiveInferenceService;
  private recommendations: ExecutiveRecommendationService;
  private personalization: ExecutivePersonalizationService;

  constructor(private repos: Repositories) {
    this.learning = new ExecutiveLearningService(repos);
    this.interview = new DiscoveryInterviewService(repos);
    this.inference = new ExecutiveInferenceService(repos);
    this.recommendations = new ExecutiveRecommendationService(repos);
    this.personalization = new ExecutivePersonalizationService(repos);
  }

  async getStatus(userId: string): Promise<ExecutiveDNAStatus> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    return {
      overallConfidence: profile.overallConfidence,
      interviewComplete: profile.interviewComplete,
      needsDiscovery: profile.overallConfidence < DISCOVERY_CONFIDENCE_TARGET,
      version: profile.version,
    };
  }

  async getProfile(userId: string): Promise<ExecutiveDNAProfile> {
    return this.repos.executiveDna.ensureProfile(userId);
  }

  get learningService(): ExecutiveLearningService {
    return this.learning;
  }

  get interviewService(): DiscoveryInterviewService {
    return this.interview;
  }

  get inferenceService(): ExecutiveInferenceService {
    return this.inference;
  }

  get recommendationService(): ExecutiveRecommendationService {
    return this.recommendations;
  }

  get personalizationService(): ExecutivePersonalizationService {
    return this.personalization;
  }

  async refreshIntelligence(userId: string): Promise<void> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    await this.inference.refresh(userId, profile);
    await this.recommendations.refresh(userId, profile);
  }

  async learnFromFieldSignal(
    userId: string,
    fieldKey: ExecutiveDNAFieldKey,
    value: unknown,
    source: Parameters<ExecutiveLearningService["observe"]>[3],
    reason: string,
    confidenceBoost = 8,
  ): Promise<ExecutiveDNAProfile> {
    return this.learning.observe(userId, fieldKey, value, source, reason, confidenceBoost);
  }
}

export function createExecutiveDNAEngine(repos: Repositories): ExecutiveDNAEngine {
  return new ExecutiveDNAEngine(repos);
}
