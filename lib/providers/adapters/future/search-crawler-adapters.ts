import { FutureAdapter } from "../../types/base";
import type { CrawlerProvider, CrawlRequest, CrawlResponse } from "../../types/crawler-provider";
import type { SearchProvider, SearchRequest, SearchResult } from "../../types/search-provider";

function stub(): never {
  throw new Error("stub");
}

export class FirecrawlAdapter extends FutureAdapter implements CrawlerProvider {
  readonly name = "firecrawl";
  readonly implementation = "adapter";

  async crawl(request: CrawlRequest): Promise<CrawlResponse> {
    void request;
    this.notConfigured();
    stub();
  }
}

export class TavilyAdapter extends FutureAdapter implements SearchProvider {
  readonly name = "tavily";
  readonly implementation = "adapter";

  async search(request: SearchRequest): Promise<SearchResult[]> {
    void request;
    this.notConfigured();
    stub();
  }
}

export class ExaAdapter extends FutureAdapter implements SearchProvider {
  readonly name = "exa";
  readonly implementation = "adapter";

  async search(request: SearchRequest): Promise<SearchResult[]> {
    void request;
    this.notConfigured();
    stub();
  }
}
