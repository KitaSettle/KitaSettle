import type { ISO8601 } from "./common";

export interface BrainUnderstandingItem {
  id: string;
  label: string;
  confidence: number;
  summary: string;
  isGrowing?: boolean;
}

export interface BrainLearningMoment {
  id: string;
  periodLabel: string;
  story: string;
  occurredAt: ISO8601;
}

export interface BrainHelpSuggestion {
  id: string;
  label: string;
  reason: string;
}

export interface BrainInsightsPayload {
  generatedAt: ISO8601;
  whatIUnderstand: BrainUnderstandingItem[];
  howILearn: BrainLearningMoment[];
  helpMeUnderstand: BrainHelpSuggestion[];
  strengths: string[];
  limitations: string[];
  overallConfidence: number;
  learningProgressLabel: string;
  learningProgressSummary: string;
}
