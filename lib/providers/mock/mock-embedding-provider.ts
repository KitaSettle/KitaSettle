import type {
  EmbeddingProvider,
  EmbeddingRequest,
  EmbeddingResponse,
} from "../types/embedding-provider";

const DIMENSIONS = 384;

function mockVector(seed: string): number[] {
  const vector: number[] = [];
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 10000;
  }

  for (let i = 0; i < DIMENSIONS; i += 1) {
    const value = Math.sin(hash + i) * 0.5 + 0.5;
    vector.push(Number(value.toFixed(6)));
  }

  return vector;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock-embedding";
  readonly implementation = "mock" as const;
  readonly ready = true;

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];

    return {
      vectors: texts.map((text) => mockVector(text)),
      dimensions: DIMENSIONS,
      model: "mock-embedding-model",
      mock: true,
    };
  }
}

export const mockEmbeddingProvider = new MockEmbeddingProvider();
