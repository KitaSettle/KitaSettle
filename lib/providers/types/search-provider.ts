import type { ProviderMetadata } from "./base";

export interface SearchRequest {
  query: string;
  limit?: number;
  trustedSourcesOnly?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
}

export interface SearchProvider extends ProviderMetadata {
  search(request: SearchRequest): Promise<SearchResult[]>;
}
