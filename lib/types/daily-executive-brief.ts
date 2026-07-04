import type { ExecutiveBrief, ResearchQueueItem } from "./ui";
import type {
  ExecutiveDNARecommendation,
  ExecutiveDNAStatus,
  ExecutivePersonalizationHints,
} from "./executive-dna";
import type { ExecutiveConnectSnapshot } from "./executive-connect";
import type { DecisionQueuePayload } from "./decision-engine";

export interface StoredExecutiveBrief extends ExecutiveBrief {
  id: string;
  createdAt: string;
  updatedAt: string;
  headline?: string;
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
  connect: ExecutiveConnectSnapshot;
  decisions: DecisionQueuePayload;
}
