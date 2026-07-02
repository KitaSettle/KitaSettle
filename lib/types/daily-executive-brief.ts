import type { ExecutiveBrief, ResearchQueueItem } from "./ui";

export interface StoredExecutiveBrief extends ExecutiveBrief {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyExecutiveBriefPayload {
  brief: StoredExecutiveBrief;
  recentResearch: ResearchQueueItem[];
  pendingApprovals: ResearchQueueItem[];
  trustedSourcesCount: number;
  generatedToday: boolean;
}
