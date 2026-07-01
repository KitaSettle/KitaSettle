import type { ProviderMetadata } from "./base";

export interface CrawlRequest {
  url: string;
  sourceId?: string;
  sourceName?: string;
}

export interface CrawlResponse {
  url: string;
  title: string;
  rawText: string;
  fetchedAt: string;
  mock: boolean;
}

export interface CrawlerProvider extends ProviderMetadata {
  crawl(request: CrawlRequest): Promise<CrawlResponse>;
}
