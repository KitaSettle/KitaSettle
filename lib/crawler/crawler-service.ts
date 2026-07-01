import type { CrawlerService, CrawlJob, CrawlResult } from "@/lib/types/crawler";
import type { EntityId } from "@/lib/types/common";
import { createId, nowIso } from "@/lib/utils";
import { trustedSourceRegistry } from "@/lib/brain/source-registry-service";
import { mockKnowledgeItems } from "@/lib/knowledge/mock-knowledge-store";

export class MockCrawlerService implements CrawlerService {
  private jobs: CrawlJob[] = [];

  async listJobs(): Promise<CrawlJob[]> {
    return [...this.jobs];
  }

  async schedule(sourceId: EntityId): Promise<CrawlJob> {
    const source = await trustedSourceRegistry.getById(sourceId);

    if (!source) {
      throw new Error(`Trusted source not found: ${sourceId}`);
    }

    const job: CrawlJob = {
      id: createId("crawl"),
      sourceId,
      sourceName: source.name,
      status: "pending",
      scheduledAt: nowIso(),
    };

    this.jobs.unshift(job);
    return job;
  }

  async run(jobId: EntityId): Promise<CrawlResult> {
    const jobIndex = this.jobs.findIndex((job) => job.id === jobId);
    if (jobIndex === -1) {
      throw new Error(`Crawl job not found: ${jobId}`);
    }

    const job = this.jobs[jobIndex];
    job.status = "running";

    const sourceItems = mockKnowledgeItems
      .filter((item) => item.source === job.sourceName)
      .map(({ id, ...item }) => {
        void id;
        return item;
      });

    const completedAt = nowIso();
    this.jobs[jobIndex] = {
      ...job,
      status: "completed",
      completedAt,
    };

    return {
      jobId,
      itemsDiscovered: sourceItems.length,
      items: sourceItems,
    };
  }
}

export const crawlerService = new MockCrawlerService();
