import { FutureAdapter } from "../../types/base";
import type {
  EmbeddingProvider,
  EmbeddingRequest,
  EmbeddingResponse,
} from "../../types/embedding-provider";
import type {
  MemoryProvider,
  MemoryRetrieveRequest,
  MemoryStoreRequest,
  VectorMemoryRecord,
} from "../../types/memory-provider";

function stub(): never {
  throw new Error("stub");
}

export class PgVectorAdapter extends FutureAdapter implements EmbeddingProvider, MemoryProvider {
  readonly name = "pgvector";
  readonly implementation = "adapter";

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    void request;
    this.notConfigured();
    stub();
  }

  async store(request: MemoryStoreRequest): Promise<VectorMemoryRecord> {
    void request;
    this.notConfigured();
    stub();
  }

  async retrieve(request: MemoryRetrieveRequest): Promise<VectorMemoryRecord[]> {
    void request;
    this.notConfigured();
    stub();
  }

  async delete(id: string): Promise<boolean> {
    void id;
    this.notConfigured();
    stub();
  }
}

export class SupabaseAdapter extends FutureAdapter implements MemoryProvider {
  readonly name = "supabase";
  readonly implementation = "adapter";

  async store(request: MemoryStoreRequest): Promise<VectorMemoryRecord> {
    void request;
    this.notConfigured();
    stub();
  }

  async retrieve(request: MemoryRetrieveRequest): Promise<VectorMemoryRecord[]> {
    void request;
    this.notConfigured();
    stub();
  }

  async delete(id: string): Promise<boolean> {
    void id;
    this.notConfigured();
    stub();
  }
}
