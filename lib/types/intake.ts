import type { EntityId, ISO8601 } from "./common";

export type IntakeSourceType = "file" | "url" | "text" | "paste";

export type IntakeProcessingStatus = "processing" | "completed" | "needs_clarification" | "failed";

export interface IntakeDetectedEntity {
  label: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface IntakeDetectedDeadline extends IntakeDetectedEntity {
  dueAt: ISO8601 | null;
}

export interface IntakeAnalysis {
  title: string;
  summary: string;
  category: string;
  subcategory: string;
  tags: string[];
  overallConfidence: number;
  professionRelevance: string;
  projects: IntakeDetectedEntity[];
  people: IntakeDetectedEntity[];
  deadlines: IntakeDetectedDeadline[];
  risks: IntakeDetectedEntity[];
  opportunities: IntakeDetectedEntity[];
  tasks: IntakeDetectedEntity[];
  reminders: IntakeDetectedDeadline[];
  relatedDocumentHints: string[];
  needsUserClarification: boolean;
  clarificationQuestions: string[];
}

export interface IntakeRecord {
  id: EntityId;
  userId: EntityId;
  sourceType: IntakeSourceType;
  sourceLabel: string;
  mimeType: string | null;
  contentPreview: string;
  analysis: IntakeAnalysis;
  status: IntakeProcessingStatus;
  knowledgeId: EntityId | null;
  createdAt: ISO8601;
}

export interface IntakeFinding {
  type: "deadline" | "person" | "project" | "risk" | "opportunity" | "task" | "reminder" | "contract" | "other";
  label: string;
}

export interface IntakeDelegationResult {
  intakeId: EntityId;
  message: string;
  findings: IntakeFinding[];
  overallConfidence: number;
  needsClarification: boolean;
  clarificationQuestions: string[];
  knowledgeId: EntityId | null;
}

export const INTAKE_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
  ".txt",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".mov",
  ".webm",
] as const;

export const INTAKE_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const INTAKE_ACCEPTED_MIME_PREFIXES = [
  "text/",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-",
  "application/csv",
  "image/",
  "audio/",
  "video/",
] as const;
