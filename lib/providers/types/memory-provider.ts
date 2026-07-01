import type { ProviderMetadata } from "./base";

export interface VectorMemoryRecord {
  id: string;
  content: string;
  metadata: Record<string, string>;
  embedding?: number[];
  score?: number;
}

export interface MemoryStoreRequest {
  content: string;
  metadata?: Record<string, string>;
  embedding?: number[];
}

export interface MemoryRetrieveRequest {
  query: string;
  limit?: number;
  embedding?: number[];
}

export interface MemoryProvider extends ProviderMetadata {
  store(request: MemoryStoreRequest): Promise<VectorMemoryRecord>;
  retrieve(request: MemoryRetrieveRequest): Promise<VectorMemoryRecord[]>;
  delete(id: string): Promise<boolean>;
}
