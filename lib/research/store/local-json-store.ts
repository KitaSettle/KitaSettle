import { promises as fs } from "fs";
import path from "path";
import type {
  LocalJsonStore,
  SourceScheduleEntry,
  StoredApprovedKnowledge,
  StoredFetchedContent,
  StoredResearchFindings,
} from "@/lib/types/live-research";
import { nowIso } from "@/lib/utils";

const STORE_DIR = path.join(process.cwd(), "data", "research", "store");
const SEED_DIR = path.join(process.cwd(), "data", "research", "seed");

const FILES = {
  fetched: "fetched-content.json",
  findings: "research-findings.json",
  approved: "approved-knowledge.json",
  schedules: "source-schedules.json",
} as const;

async function ensureStoreDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export class FileLocalJsonStore implements LocalJsonStore {
  private storePath(fileName: string): string {
    return path.join(STORE_DIR, fileName);
  }

  private seedPath(fileName: string): string {
    return path.join(SEED_DIR, fileName);
  }

  async resetRuntimeStore(): Promise<void> {
    await ensureStoreDir();
    const timestamp = nowIso();

    await writeJson<StoredFetchedContent>(this.storePath(FILES.fetched), {
      documents: [],
      lastUpdated: timestamp,
    });
    await writeJson<StoredResearchFindings>(this.storePath(FILES.findings), {
      findings: [],
      lastUpdated: timestamp,
    });
    await writeJson<StoredApprovedKnowledge>(this.storePath(FILES.approved), {
      knowledgeIds: [],
      findings: [],
      lastUpdated: timestamp,
    });

    const seedSchedules = await readJson<SourceScheduleEntry[]>(
      this.seedPath(FILES.schedules),
      [],
    );
    await this.saveSchedules(
      seedSchedules.map((entry) => ({ ...entry, lastCheckedAt: null })),
    );
  }

  async getFetchedContent(): Promise<StoredFetchedContent> {
    await ensureStoreDir();
    return readJson<StoredFetchedContent>(this.storePath(FILES.fetched), {
      documents: [],
      lastUpdated: nowIso(),
    });
  }

  async saveFetchedContent(data: StoredFetchedContent): Promise<void> {
    await ensureStoreDir();
    await writeJson(this.storePath(FILES.fetched), data);
  }

  async getFindings(): Promise<StoredResearchFindings> {
    await ensureStoreDir();
    return readJson<StoredResearchFindings>(this.storePath(FILES.findings), {
      findings: [],
      lastUpdated: nowIso(),
    });
  }

  async saveFindings(data: StoredResearchFindings): Promise<void> {
    await ensureStoreDir();
    await writeJson(this.storePath(FILES.findings), data);
  }

  async getApprovedKnowledge(): Promise<StoredApprovedKnowledge> {
    await ensureStoreDir();
    return readJson<StoredApprovedKnowledge>(this.storePath(FILES.approved), {
      knowledgeIds: [],
      findings: [],
      lastUpdated: nowIso(),
    });
  }

  async saveApprovedKnowledge(data: StoredApprovedKnowledge): Promise<void> {
    await ensureStoreDir();
    await writeJson(this.storePath(FILES.approved), data);
  }

  async getSchedules(): Promise<SourceScheduleEntry[]> {
    await ensureStoreDir();
    const runtime = await readJson<SourceScheduleEntry[] | null>(
      this.storePath(FILES.schedules),
      null,
    );
    if (runtime) return runtime;

    return readJson<SourceScheduleEntry[]>(this.seedPath(FILES.schedules), []);
  }

  async saveSchedules(schedules: SourceScheduleEntry[]): Promise<void> {
    await ensureStoreDir();
    await writeJson(this.storePath(FILES.schedules), schedules);
  }
}

export const localJsonStore = new FileLocalJsonStore();
