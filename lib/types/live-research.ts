import type { EntityId, Importance, ISO8601 } from "./common";

export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export type ContentCategory =
  | "Aviation"
  | "Engineering"
  | "Business"
  | "Finance"
  | "AI"
  | "Leadership"
  | "Regulations"
  | "Opportunities";

export interface SourceScheduleEntry {
  sourceId: EntityId;
  sourceName: string;
  frequency: ScheduleFrequency;
  lastCheckedAt: ISO8601 | null;
  enabled: boolean;
}

export interface FetchedDocument {
  id: EntityId;
  sourceId: EntityId;
  sourceName: string;
  title: string;
  url: string;
  rawText: string;
  fetchedAt: ISO8601;
}

export interface ExtractedDocument {
  fetchedDocumentId: EntityId;
  sourceId: EntityId;
  sourceName: string;
  title: string;
  url: string;
  cleanText: string;
  extractedAt: ISO8601;
}

export interface ClassifiedContent {
  extractedDocumentId: EntityId;
  category: ContentCategory;
  subcategory: string;
  tags: string[];
  classifiedAt: ISO8601;
}

export interface ExecutiveSummary {
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  confidence: number;
  importance: Importance;
}

export interface ResearchFinding {
  id: EntityId;
  sourceId: EntityId;
  sourceName: string;
  title: string;
  url: string;
  category: ContentCategory;
  subcategory: string;
  tags: string[];
  cleanText: string;
  executiveSummary: ExecutiveSummary;
  status: "pending_review" | "ready" | "approved" | "rejected" | "duplicate";
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface StoredFetchedContent {
  documents: FetchedDocument[];
  lastUpdated: ISO8601;
}

export interface StoredResearchFindings {
  findings: ResearchFinding[];
  lastUpdated: ISO8601;
}

export interface StoredApprovedKnowledge {
  knowledgeIds: EntityId[];
  findings: ResearchFinding[];
  lastUpdated: ISO8601;
}

export interface SourceScheduler {
  getSchedules(): Promise<SourceScheduleEntry[]>;
  getDueSources(asOf?: Date): Promise<SourceScheduleEntry[]>;
  markChecked(sourceId: EntityId, checkedAt?: Date): Promise<void>;
}

export interface SourceFetcher {
  fetch(sourceId: EntityId, sourceName: string): Promise<FetchedDocument[]>;
}

export interface DocumentExtractor {
  extract(document: FetchedDocument): ExtractedDocument;
}

export interface DuplicateDetector {
  isDuplicate(
    candidate: Pick<ExtractedDocument, "title" | "url" | "cleanText">,
    existing: Array<Pick<ExtractedDocument, "title" | "url"> & { id?: EntityId }>,
  ): boolean;
}

export interface ContentClassifier {
  classify(
    document: ExtractedDocument,
    sourceName: string,
  ): Omit<ClassifiedContent, "extractedDocumentId" | "classifiedAt">;
}

export interface ExecutiveSummariser {
  summarise(
    document: ExtractedDocument,
    classification: ClassifiedContent,
  ): Promise<ExecutiveSummary>;
}

export interface ResearchReviewer {
  submitForReview(finding: ResearchFinding): Promise<ResearchFinding>;
  listPendingReview(): Promise<ResearchFinding[]>;
  listReadyForApproval(): Promise<ResearchFinding[]>;
}

export interface KnowledgeWriter {
  writeApproved(finding: ResearchFinding): Promise<EntityId>;
}

export interface LiveResearchPipelineResult {
  sourcesChecked: number;
  itemsFetched: number;
  duplicatesRemoved: number;
  researchItemsCreated: number;
  itemsReadyForApproval: number;
  sampleSummary: ExecutiveSummary | null;
  findings: ResearchFinding[];
}

export interface LiveResearchPipeline {
  run(asOf?: Date): Promise<LiveResearchPipelineResult>;
}

export interface LocalJsonStore {
  getFetchedContent(): Promise<StoredFetchedContent>;
  saveFetchedContent(data: StoredFetchedContent): Promise<void>;
  getFindings(): Promise<StoredResearchFindings>;
  saveFindings(data: StoredResearchFindings): Promise<void>;
  getApprovedKnowledge(): Promise<StoredApprovedKnowledge>;
  saveApprovedKnowledge(data: StoredApprovedKnowledge): Promise<void>;
  getSchedules(): Promise<SourceScheduleEntry[]>;
  saveSchedules(schedules: SourceScheduleEntry[]): Promise<void>;
  resetRuntimeStore(): Promise<void>;
}
