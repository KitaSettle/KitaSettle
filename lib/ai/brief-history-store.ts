import { promises as fs } from "fs";
import path from "path";
import type {
  AIExecutiveBriefOutput,
  ExecutiveBriefHistoryEntry,
  StoredExecutiveBriefsFile,
} from "./types";
import { nowIso } from "@/lib/utils";

const STORE_DIR = path.join(process.cwd(), "data", "store");
const BRIEFS_FILE = "executive-briefs.json";
const MAX_HISTORY = 30;

async function ensureStoreDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function filePath(): string {
  return path.join(STORE_DIR, BRIEFS_FILE);
}

async function readStore(): Promise<StoredExecutiveBriefsFile> {
  try {
    const raw = await fs.readFile(filePath(), "utf-8");
    return JSON.parse(raw) as StoredExecutiveBriefsFile;
  } catch {
    return {
      briefs: [],
      history: [],
      lastUpdated: nowIso(),
    };
  }
}

function toHistoryEntry(brief: AIExecutiveBriefOutput): ExecutiveBriefHistoryEntry {
  return {
    id: brief.id,
    headline: brief.headline,
    timestamp: brief.generatedAt,
    topicsUsed: brief.topicsUsed,
    confidence: brief.confidence,
    estimatedReadingSaved: brief.estimatedReadingSaved,
  };
}

export class ExecutiveBriefHistoryStore {
  async getAllBriefs(): Promise<AIExecutiveBriefOutput[]> {
    const store = await readStore();
    return store.briefs;
  }

  async getHistory(): Promise<ExecutiveBriefHistoryEntry[]> {
    const store = await readStore();
    return store.history;
  }

  async saveBrief(brief: AIExecutiveBriefOutput): Promise<void> {
    await ensureStoreDir();
    const store = await readStore();

    store.briefs.unshift(brief);
    store.history.unshift(toHistoryEntry(brief));

    store.briefs = store.briefs.slice(0, MAX_HISTORY);
    store.history = store.history.slice(0, MAX_HISTORY);
    store.lastUpdated = nowIso();

    await fs.writeFile(filePath(), `${JSON.stringify(store, null, 2)}\n`, "utf-8");
  }

  async reset(): Promise<void> {
    await ensureStoreDir();
    await fs.writeFile(
      filePath(),
      `${JSON.stringify({ briefs: [], history: [], lastUpdated: nowIso() }, null, 2)}\n`,
      "utf-8",
    );
  }
}

export const executiveBriefHistoryStore = new ExecutiveBriefHistoryStore();
