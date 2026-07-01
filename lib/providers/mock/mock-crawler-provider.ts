import type {
  CrawlerProvider,
  CrawlRequest,
  CrawlResponse,
} from "../types/crawler-provider";
import { nowIso } from "@/lib/utils";

export class MockCrawlerProvider implements CrawlerProvider {
  readonly name = "mock-crawler";
  readonly implementation = "mock" as const;
  readonly ready = true;

  async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    const source = request.sourceName ?? "Trusted Source";

    return {
      url: request.url,
      title: `${source} — mock crawled document`,
      rawText: `Mock crawled content from ${request.url}. Navigation | Footer removed in extractor stage. Executive-relevant update prepared for review.`,
      fetchedAt: nowIso(),
      mock: true,
    };
  }
}

export const mockCrawlerProvider = new MockCrawlerProvider();
