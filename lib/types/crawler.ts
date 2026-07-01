import type { EntityId, ISO8601 } from "./common";
import type { KnowledgeItem } from "./knowledge";

export type CrawlJobStatus = "pending" | "running" | "completed" | "failed";

export interface CrawlJob {
  id: EntityId;
  sourceId: EntityId;
  sourceName: string;
  status: CrawlJobStatus;
  scheduledAt: ISO8601;
  completedAt?: ISO8601;
}

export interface CrawlResult {
  jobId: EntityId;
  itemsDiscovered: number;
  items: Omit<KnowledgeItem, "id">[];
}

export interface CrawlerService {
  listJobs(): Promise<CrawlJob[]>;
  schedule(sourceId: EntityId): Promise<CrawlJob>;
  run(jobId: EntityId): Promise<CrawlResult>;
}
