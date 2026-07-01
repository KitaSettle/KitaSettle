import type { KnowledgeItem } from "@/lib/types/knowledge";
import type { MemoryItem } from "@/lib/types/memory";
import type { ResearchQueueRecord } from "@/lib/types/research";
import type {
  BriefOpportunity,
  BriefPriority,
  BriefRisk,
  CalendarEvent,
  ExecutiveTask,
} from "@/lib/types/executive";
import type { EntityId, ISO8601 } from "@/lib/types/common";
import type { ContentCategory } from "@/lib/types/live-research";

export interface SummarizeInput {
  text: string;
  context?: string;
  maxLength?: number;
}

export interface SummarizeOutput {
  summary: string;
  mock: true;
}

export interface ClassifyInput {
  title: string;
  content: string;
  source?: string;
}

export interface ClassifyOutput {
  category: ContentCategory | string;
  subcategory: string;
  tags: string[];
  mock: true;
}

export interface ExtractRisksInput {
  knowledge: KnowledgeItem[];
  memory: MemoryItem[];
  research: ResearchQueueRecord[];
}

export interface ExtractRisksOutput {
  risks: BriefRisk[];
  mock: true;
}

export interface ExtractOpportunitiesInput {
  knowledge: KnowledgeItem[];
  memory: MemoryItem[];
  research: ResearchQueueRecord[];
}

export interface ExtractOpportunitiesOutput {
  opportunities: BriefOpportunity[];
  mock: true;
}

export interface CompareDocumentsInput {
  documentA: { title: string; content: string };
  documentB: { title: string; content: string };
}

export interface CompareDocumentsOutput {
  summary: string;
  differences: string[];
  alignmentScore: number;
  mock: true;
}

export interface AIExecutiveBriefInput {
  knowledge: KnowledgeItem[];
  memory: MemoryItem[];
  research: ResearchQueueRecord[];
  calendar: CalendarEvent[];
  tasks: ExecutiveTask[];
}

export interface AIExecutiveBriefOutput {
  id: EntityId;
  headline: string;
  executiveSummary: string;
  topPriorities: BriefPriority[];
  risks: BriefRisk[];
  opportunities: BriefOpportunity[];
  recommendedActions: string[];
  estimatedReadingSaved: string;
  confidence: number;
  topicsUsed: string[];
  generatedAt: ISO8601;
  mock: true;
}

export interface ExecutiveBriefHistoryEntry {
  id: EntityId;
  headline: string;
  timestamp: ISO8601;
  topicsUsed: string[];
  confidence: number;
  estimatedReadingSaved: string;
}

export interface StoredExecutiveBriefsFile {
  briefs: AIExecutiveBriefOutput[];
  history: ExecutiveBriefHistoryEntry[];
  lastUpdated: ISO8601;
}
