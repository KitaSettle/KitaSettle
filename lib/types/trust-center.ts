import type { ISO8601 } from "./common";
import type { ConnectService } from "./executive-connect";

export interface TrustPermissionItem {
  id: string;
  provider: string;
  service: ConnectService | "future";
  label: string;
  connected: boolean;
  lastSyncAt: ISO8601 | null;
  lastSyncLabel: string;
  accountEmail: string | null;
  connectUrl: string | null;
  disconnectAction: "google" | null;
}

export interface TrustRelationshipMetrics {
  daysTogether: number;
  daysTogetherLabel: string;
  documentsLearned: number;
  meetingsUnderstood: number;
  projects: number;
  decisions: number;
  estimatedHoursSaved: number;
  executiveBrainConfidence: number;
  learningProgress: string;
}

export interface TrustCenterPayload {
  generatedAt: ISO8601;
  account: { name: string; email: string };
  relationship: TrustRelationshipMetrics;
  permissions: TrustPermissionItem[];
  exportFormats: Array<"json" | "zip">;
}

export type TrustDeleteScope =
  | "documents"
  | "knowledge"
  | "memory"
  | "account";

export interface TrustDeleteResult {
  scope: TrustDeleteScope;
  deletedCount: number;
  message: string;
}
