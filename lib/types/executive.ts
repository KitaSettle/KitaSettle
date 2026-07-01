import type { KnowledgeItem } from "./knowledge";
import type { MemoryItem } from "./memory";
import type { ResearchQueueRecord } from "./research";
import type { EntityId, ISO8601 } from "./common";

export interface CalendarEvent {
  id: EntityId;
  title: string;
  startAt: ISO8601;
  endAt: ISO8601;
  category: string;
}

export interface ExecutiveTask {
  id: EntityId;
  title: string;
  dueAt: ISO8601;
  status: "pending" | "in-progress" | "done";
  priority: number;
}

export interface BriefPriority {
  id: EntityId;
  title: string;
  description?: string;
}

export interface BriefRisk {
  id: EntityId;
  title: string;
}

export interface BriefOpportunity {
  id: EntityId;
  title: string;
}

export interface ExecutiveBriefInput {
  knowledge: KnowledgeItem[];
  memory: MemoryItem[];
  research: ResearchQueueRecord[];
  calendar: CalendarEvent[];
  tasks: ExecutiveTask[];
}

export interface ExecutiveBriefOutput {
  id: EntityId;
  headline: string;
  executiveSummary: string;
  summary: string;
  topPriorities: BriefPriority[];
  risks: BriefRisk[];
  opportunities: BriefOpportunity[];
  recommendedActions: string[];
  recommendedFocus: string;
  estimatedReadingSaved: string;
  estimatedWorkload: string;
  confidence: number;
  confidenceScore: number;
  topicsUsed: string[];
  generatedAt: ISO8601;
}

export interface ExecutiveBriefGenerator {
  generate(input: ExecutiveBriefInput): Promise<ExecutiveBriefOutput>;
}
