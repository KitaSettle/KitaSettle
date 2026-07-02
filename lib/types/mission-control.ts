import type { ISO8601 } from "./common";

export interface MetricValue {
  label: string;
  value: string | number;
  hint?: string;
}

export interface ExecutiveSummarySection {
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate: number;
  invitationsSent: number;
  betaUsers: number;
  professionBreakdown: Array<{ profession: string; count: number }>;
}

export interface AiAnalyticsSection {
  todayAiCostUsd: number;
  monthlyAiCostUsd: number;
  averageCostPerUserUsd: number;
  averageCostPerBriefUsd: number;
  averageCostPerIntakeUsd: number;
  mostExpensiveUser: string | null;
  mostExpensiveFeature: string | null;
  aiRequests: number;
  aiRequestsAvoided: number;
  cacheHitRate: number;
  averageResponseTimeMs: number;
  aiErrors: number;
}

export interface ExecutiveBrainSection {
  briefsGenerated: number;
  decisionQueueItemsCreated: number;
  knowledgeItems: number;
  memoryEntries: number;
  executiveDnaAverageConfidence: number;
  researchCompleted: number;
  documentsUnderstood: number;
  giveToKitaUploads: number;
}

export interface SecuritySection {
  failedLogins: number;
  rateLimitEvents: number;
  promptInjectionAttempts: number;
  apiAbuseEvents: number;
  suspiciousActivity: number;
  auditEvents: number;
}

export interface InfrastructureSection {
  openaiStatus: "operational" | "degraded" | "offline";
  supabaseStatus: "operational" | "degraded" | "offline";
  googleStatus: "operational" | "degraded" | "offline";
  syncQueuePending: number;
  backgroundJobsRunning: number;
  healthChecksPassing: boolean;
  databaseHealth: "healthy" | "warning" | "critical";
  storageUsageMb: number;
}

export interface FeedbackItem {
  id: string;
  userId: string | null;
  type: string;
  rating: number | null;
  message: string;
  createdAt: ISO8601;
}

export interface FeedbackHubSection {
  totalFeedback: number;
  voiceNotes: number;
  screenshots: number;
  bugReports: number;
  featureRequests: number;
  averageRating: number;
  recent: FeedbackItem[];
}

export interface ErrorCenterSection {
  unhandledErrors: number;
  failedJobs: number;
  syncFailures: number;
  retryQueueSize: number;
  recentErrors: Array<{ id: string; source: string; message: string; createdAt: ISO8601 }>;
}

export interface FinancialSection {
  estimatedMonthlyCostUsd: number;
  estimatedMonthlyRevenueUsd: number;
  aiGrossMargin: number;
  projectedBurnUsd: number;
}

export interface AiRoiSection {
  estimatedHoursSaved: number;
  minutesSavedPerBrief: number;
  minutesSavedPerUpload: number;
  estimatedProductivityGainPercent: number;
}

export interface BetaUserRow {
  id: string;
  name: string;
  email: string;
  profession: string | null;
  isDisabled: boolean;
  dailyAiBudgetUsd: number;
  betaNotes: string | null;
  invitedAt: ISO8601 | null;
}

export interface BetaManagementSection {
  users: BetaUserRow[];
  pendingInvites: number;
  defaultDailyAiBudgetUsd: number;
}

export interface MissionControlPayload {
  generatedAt: ISO8601;
  executiveSummary: ExecutiveSummarySection;
  aiAnalytics: AiAnalyticsSection;
  executiveBrain: ExecutiveBrainSection;
  security: SecuritySection;
  infrastructure: InfrastructureSection;
  feedbackHub: FeedbackHubSection;
  errorCenter: ErrorCenterSection;
  financial: FinancialSection;
  aiRoi: AiRoiSection;
  betaManagement: BetaManagementSection;
}

export interface AiUsageRecord {
  userId: string | null;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  responseTimeMs?: number;
  cached?: boolean;
  error?: boolean;
}

export interface FeedbackRecordInput {
  userId?: string | null;
  type: "feedback" | "voice_note" | "screenshot" | "bug" | "feature_request" | "rating";
  rating?: number | null;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecordInput {
  userId?: string | null;
  source: string;
  message: string;
  stackTrace?: string | null;
  metadata?: Record<string, unknown>;
  retryable?: boolean;
}
