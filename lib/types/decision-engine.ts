import type { EntityId, ISO8601 } from "./common";

export type DecisionInputSource =
  | "calendar"
  | "email"
  | "research"
  | "knowledge"
  | "project"
  | "approval"
  | "document"
  | "deadline"
  | "memory"
  | "executive_dna";

export type DecisionStatus = "pending" | "completed" | "ignored" | "delayed" | "rejected";

export type DecisionLearningEventType =
  | "completed"
  | "ignored"
  | "delayed"
  | "rejected";

export interface DecisionFactors {
  impact: number;
  urgency: number;
  risk: number;
  confidence: number;
  dependencies: number;
  estimatedTime: number;
  energyRequired: number;
  financialEffect: number;
  strategicImportance: number;
}

export type DecisionFactorWeights = DecisionFactors;

export interface DecisionItem {
  id: EntityId;
  userId: EntityId;
  externalKey: string;
  title: string;
  actionLabel: string;
  source: DecisionInputSource;
  sourceRef: string | null;
  factors: DecisionFactors;
  score: number;
  confidence: number;
  explanation: string;
  because: string[];
  status: DecisionStatus;
  queuedFor: string;
  metadata: Record<string, unknown>;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface DecisionCandidate {
  externalKey: string;
  title: string;
  actionLabel: string;
  source: DecisionInputSource;
  sourceRef?: string | null;
  factors: DecisionFactors;
  metadata?: Record<string, unknown>;
}

export interface DecisionQueuePayload {
  generatedAt: ISO8601;
  topActions: DecisionItem[];
  allDecisions: DecisionItem[];
  totalCandidates: number;
  weights: DecisionFactorWeights;
}

export interface DecisionLearningEvent {
  id: EntityId;
  userId: EntityId;
  decisionId: EntityId | null;
  externalKey: string | null;
  eventType: DecisionLearningEventType;
  source: DecisionInputSource | null;
  scoreBefore: number | null;
  weightAdjustments: Partial<DecisionFactorWeights>;
  reason: string;
  createdAt: ISO8601;
}

export const DEFAULT_DECISION_WEIGHTS: DecisionFactorWeights = {
  impact: 0.18,
  urgency: 0.16,
  risk: 0.12,
  confidence: 0.1,
  dependencies: 0.08,
  estimatedTime: 0.06,
  energyRequired: 0.05,
  financialEffect: 0.15,
  strategicImportance: 0.1,
};

export function createEmptyDecisionFactors(): DecisionFactors {
  return {
    impact: 0,
    urgency: 0,
    risk: 0,
    confidence: 0,
    dependencies: 0,
    estimatedTime: 0,
    energyRequired: 0,
    financialEffect: 0,
    strategicImportance: 0,
  };
}
