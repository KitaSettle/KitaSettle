import type { AIExecutiveBriefOutput, ExecutiveBriefHistoryEntry } from "./types";
import type { ExecutiveBriefRepository } from "@/lib/repositories/executive-brief-repository";
import type { Repositories } from "@/lib/repositories";
import { getScriptRepositories } from "@/lib/repositories/script";

export class ExecutiveBriefHistoryStore {
  constructor(
    private repository: ExecutiveBriefRepository,
    private userId: string,
  ) {}

  getAllBriefs(): Promise<AIExecutiveBriefOutput[]> {
    return Promise.resolve([]);
  }

  getHistory(): Promise<ExecutiveBriefHistoryEntry[]> {
    return this.repository.getHistory(this.userId);
  }

  saveBrief(brief: AIExecutiveBriefOutput): Promise<void> {
    return this.repository.saveGenerated(this.userId, brief);
  }

  reset(): Promise<void> {
    return Promise.resolve();
  }
}

export async function createExecutiveBriefHistoryStore(
  userId: string,
  repos?: Repositories,
): Promise<ExecutiveBriefHistoryStore> {
  const repositories = repos ?? getScriptRepositories();
  return new ExecutiveBriefHistoryStore(repositories.executiveBriefs, userId);
}
