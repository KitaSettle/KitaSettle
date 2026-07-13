import type { EntityId, ISO8601 } from "./common";

export const EXECUTIVE_DNA_FIELDS = [
  "profession",
  "industry",
  "role",
  "responsibilities",
  "goals",
  "currentProjects",
  "decisionStyle",
  "leadershipStyle",
  "communicationStyle",
  "riskAppetite",
  "preferredBriefLength",
  "preferredWorkingHours",
  "meetingPreferences",
  "researchInterests",
  "learningInterests",
  "importantTopics",
  "focusAreas",
  "preferredAiPersonality",
  "notificationPreferences",
  "dailyBriefTime",
  "confidenceThreshold",
  "executiveLevel",
] as const;

export type ExecutiveDNAFieldKey = (typeof EXECUTIVE_DNA_FIELDS)[number];

export interface ExecutiveDNAProfileData {
  profession: string;
  industry: string;
  role: string;
  responsibilities: string[];
  goals: string[];
  currentProjects: string[];
  decisionStyle: string;
  leadershipStyle: string;
  communicationStyle: string;
  riskAppetite: string;
  preferredBriefLength: string;
  preferredWorkingHours: string;
  meetingPreferences: string;
  researchInterests: string[];
  learningInterests: string[];
  importantTopics: string[];
  focusAreas: string[];
  preferredAiPersonality: string;
  notificationPreferences: string;
  dailyBriefTime: string;
  confidenceThreshold: number;
  executiveLevel: string;
}

export interface ExecutiveDNAFieldConfidence {
  fieldKey: ExecutiveDNAFieldKey;
  confidence: number;
  value: unknown;
  updatedAt: ISO8601;
}

export interface ExecutiveDNAProfile {
  id: EntityId;
  userId: EntityId;
  profile: ExecutiveDNAProfileData;
  fieldConfidence: ExecutiveDNAFieldConfidence[];
  overallConfidence: number;
  interviewComplete: boolean;
  version: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface ExecutiveDNALearningEvent {
  id: EntityId;
  userId: EntityId;
  fieldKey: ExecutiveDNAFieldKey | string;
  previousValue: unknown;
  newValue: unknown;
  confidenceBefore: number;
  confidenceAfter: number;
  source: ExecutiveDNALearningSource;
  reason: string;
  createdAt: ISO8601;
}

export type ExecutiveDNALearningSource =
  | "discovery_interview"
  | "approval"
  | "rejection"
  | "search"
  | "research_opened"
  | "knowledge_saved"
  | "brief_usage"
  | "calendar"
  | "email"
  | "document_upload"
  | "inference"
  | "manual"
  | "conversation";

export interface ExecutiveDNAProfileVersion {
  id: EntityId;
  userId: EntityId;
  version: number;
  profile: ExecutiveDNAProfileData;
  overallConfidence: number;
  changeReason: string;
  createdAt: ISO8601;
}

export interface ExecutiveDNAInference {
  id: EntityId;
  userId: EntityId;
  inferenceType: ExecutiveDNAInferenceType;
  payload: Record<string, unknown>;
  confidence: number;
  updatedAt: ISO8601;
}

export type ExecutiveDNAInferenceType =
  | "pain_points"
  | "strengths"
  | "weaknesses"
  | "blind_spots"
  | "decision_biases"
  | "opportunities"
  | "time_wasters"
  | "productivity_pattern";

export interface ExecutiveDNARecommendation {
  id: EntityId;
  recommendation: string;
  category: string;
  priority: number;
  dismissed: boolean;
  createdAt: ISO8601;
}

export interface DiscoveryInterviewMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: ISO8601;
}

export interface DiscoveryInterviewSession {
  id: EntityId;
  userId: EntityId;
  messages: DiscoveryInterviewMessage[];
  overallConfidence: number;
  isComplete: boolean;
  updatedAt: ISO8601;
}

export interface DiscoveryInterviewResponse {
  session: DiscoveryInterviewSession;
  nextQuestion: string | null;
  overallConfidence: number;
  isComplete: boolean;
}

export interface ExecutiveDNAStatus {
  overallConfidence: number;
  interviewComplete: boolean;
  needsDiscovery: boolean;
  version: number;
}

export interface ExecutivePersonalizationHints {
  professionLabel: string;
  priorityFocus: string;
  briefTone: string;
  emphasisAreas: string[];
}

export function createEmptyExecutiveDNAProfile(): ExecutiveDNAProfileData {
  return {
    profession: "",
    industry: "",
    role: "",
    responsibilities: [],
    goals: [],
    currentProjects: [],
    decisionStyle: "",
    leadershipStyle: "",
    communicationStyle: "",
    riskAppetite: "",
    preferredBriefLength: "standard",
    preferredWorkingHours: "",
    meetingPreferences: "",
    researchInterests: [],
    learningInterests: [],
    importantTopics: [],
    focusAreas: [],
    preferredAiPersonality: "executive-advisor",
    notificationPreferences: "balanced",
    dailyBriefTime: "07:00",
    confidenceThreshold: 85,
    executiveLevel: "",
  };
}

export const DISCOVERY_CONFIDENCE_TARGET = 90;
