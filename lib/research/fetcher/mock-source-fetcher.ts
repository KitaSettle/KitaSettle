import { promises as fs } from "fs";
import path from "path";
import type { FetchedDocument, SourceFetcher } from "@/lib/types/live-research";
import type { EntityId } from "@/lib/types/common";
import { createId, nowIso } from "@/lib/utils";

interface MockSourceContentEntry {
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  rawText: string;
}

const SEED_PATH = path.join(
  process.cwd(),
  "data",
  "research",
  "seed",
  "mock-source-content.json",
);

async function loadMockCatalog(): Promise<MockSourceContentEntry[]> {
  const raw = await fs.readFile(SEED_PATH, "utf-8");
  return JSON.parse(raw) as MockSourceContentEntry[];
}

export class MockSourceFetcher implements SourceFetcher {
  async fetch(sourceId: EntityId, sourceName: string): Promise<FetchedDocument[]> {
    const catalog = await loadMockCatalog();
    const fetchedAt = nowIso();

    return catalog
      .filter((entry) => entry.sourceId === sourceId)
      .map((entry) => ({
        id: createId("fetch"),
        sourceId,
        sourceName: entry.sourceName || sourceName,
        title: entry.title,
        url: entry.url,
        rawText: entry.rawText,
        fetchedAt,
      }));
  }
}

export const sourceFetcher = new MockSourceFetcher();
