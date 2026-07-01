import type { ProviderMetadata } from "./base";

export interface EmbeddingRequest {
  text: string | string[];
}

export interface EmbeddingResponse {
  vectors: number[][];
  dimensions: number;
  model: string;
  mock: boolean;
}

export interface EmbeddingProvider extends ProviderMetadata {
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}
