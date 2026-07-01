import type {
  MemoryProvider,
  MemoryRetrieveRequest,
  MemoryStoreRequest,
  VectorMemoryRecord,
} from "../types/memory-provider";
import { createId } from "@/lib/utils";

export class MockMemoryProvider implements MemoryProvider {
  readonly name = "mock-vector-memory";
  readonly implementation = "mock" as const;
  readonly ready = true;

  private records: VectorMemoryRecord[] = [
    {
      id: "vec-mem-1",
      content: "CBTA lesson improvement note — add stronger scenario discussion.",
      metadata: { category: "Training", tags: "CBTA" },
    },
    {
      id: "vec-mem-2",
      content: "Steelworks proposal scope confirmed with phased delivery milestones.",
      metadata: { category: "Decisions", tags: "Proposal,Steelworks" },
    },
  ];

  async store(request: MemoryStoreRequest): Promise<VectorMemoryRecord> {
    const record: VectorMemoryRecord = {
      id: createId("vec-mem"),
      content: request.content,
      metadata: request.metadata ?? {},
      embedding: request.embedding,
    };

    this.records.unshift(record);
    return record;
  }

  async retrieve(request: MemoryRetrieveRequest): Promise<VectorMemoryRecord[]> {
    const query = request.query.toLowerCase();
    const limit = request.limit ?? 5;

    return this.records
      .filter(
        (record) =>
          record.content.toLowerCase().includes(query) ||
          Object.values(record.metadata).some((value) =>
            value.toLowerCase().includes(query),
          ),
      )
      .slice(0, limit)
      .map((record, index) => ({ ...record, score: 0.9 - index * 0.05 }));
  }

  async delete(id: string): Promise<boolean> {
    const before = this.records.length;
    this.records = this.records.filter((record) => record.id !== id);
    return this.records.length < before;
  }
}

export const mockMemoryProvider = new MockMemoryProvider();
