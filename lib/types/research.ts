import type { EntityId, Importance, ISO8601 } from "./common";

export type ResearchQueueStatus =
  | "Queued"
  | "Searching"
  | "Analysing"
  | "Ready"
  | "Approved"
  | "Rejected";

export interface ResearchQueueRecord {
  id: EntityId;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  confidence: number;
  importance: Importance;
  whyItMatters: string;
  status: ResearchQueueStatus;
  tags: string[];
  queuedAt: ISO8601;
  updatedAt: ISO8601;
}

export interface ResearchQueueService {
  list(): Promise<ResearchQueueRecord[]>;
  getById(id: EntityId): Promise<ResearchQueueRecord | null>;
  listByStatus(status: ResearchQueueStatus): Promise<ResearchQueueRecord[]>;
  enqueue(item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">): Promise<ResearchQueueRecord>;
  updateStatus(id: EntityId, status: ResearchQueueStatus): Promise<ResearchQueueRecord | null>;
  approve(id: EntityId): Promise<ResearchQueueRecord | null>;
  reject(id: EntityId): Promise<ResearchQueueRecord | null>;
}
