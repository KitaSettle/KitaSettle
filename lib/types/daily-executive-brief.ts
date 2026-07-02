import type { ExecutiveBrief, ResearchQueueItem } from "./ui";
import type {
  ExecutiveDNARecommendation,
  ExecutiveDNAStatus,
  ExecutivePersonalizationHints,
} from "./executive-dna";

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
  dna: {
    status: ExecutiveDNAStatus;
    personalization: ExecutivePersonalizationHints;
    recommendations: ExecutiveDNARecommendation[];
  };
}
