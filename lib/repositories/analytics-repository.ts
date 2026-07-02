import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiAnalyticsSection,
  BetaManagementSection,
  BetaUserRow,
  ErrorCenterSection,
  ExecutiveBrainSection,
  ExecutiveSummarySection,
  FeedbackHubSection,
  FeedbackItem,
  InfrastructureSection,
  SecuritySection,
} from "@/lib/types/mission-control";
import { isGoogleOAuthConfigured, isOpenAIConfigured, isSupabaseConfigured } from "@/lib/config/env";

export interface AnalyticsRepository {
  getExecutiveSummary(): Promise<ExecutiveSummarySection>;
  getExecutiveBrainMetrics(): Promise<ExecutiveBrainSection>;
  getSecurityMetrics(): Promise<SecuritySection>;
  getInfrastructureMetrics(): Promise<InfrastructureSection>;
  getFeedbackSummary(): Promise<FeedbackHubSection>;
  getErrorCenterSummary(): Promise<ErrorCenterSection>;
  getBetaManagement(): Promise<BetaManagementSection>;
  getAiUsageAggregates(): Promise<{
    todayCost: number;
    monthCost: number;
    requests: number;
    errors: number;
    avgResponseMs: number;
    cacheHits: number;
    totalCalls: number;
    byUser: Array<{ userId: string; cost: number; email?: string }>;
    byFeature: Array<{ feature: string; cost: number }>;
    briefCount: number;
    intakeCount: number;
  }>;
}

function startOfDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  constructor(private client: SupabaseClient) {}

  async getExecutiveSummary(): Promise<ExecutiveSummarySection> {
    const [{ count: totalUsers }, { data: auditRows }, { count: inviteCount }, { count: betaCount }] =
      await Promise.all([
        this.client.from("users").select("*", { count: "exact", head: true }),
        this.client.from("audit_logs").select("user_id, created_at").gte("created_at", daysAgoIso(30)),
        this.client.from("beta_invites").select("*", { count: "exact", head: true }),
        this.client.from("users").select("*", { count: "exact", head: true }).not("invited_at", "is", null),
      ]);

    const dayStart = startOfDayIso();
    const weekStart = daysAgoIso(7);
    const monthStart = daysAgoIso(30);

    const unique = (since: string) =>
      new Set(
        (auditRows ?? [])
          .filter((row) => row.created_at >= since && row.user_id)
          .map((row) => row.user_id as string),
      ).size;

    const { data: profiles } = await this.client.from("executive_dna_profiles").select("profile");
    const professionMap = new Map<string, number>();
    for (const row of profiles ?? []) {
      const profession = String((row.profile as { profession?: string })?.profession ?? "Unknown");
      professionMap.set(profession, (professionMap.get(profession) ?? 0) + 1);
    }

    const dau = unique(dayStart);
    const mau = unique(monthStart);
    const retention = mau > 0 ? Math.round((unique(weekStart) / mau) * 100) : 0;

    return {
      activeUsers: totalUsers ?? 0,
      dailyActiveUsers: dau,
      weeklyActiveUsers: unique(weekStart),
      monthlyActiveUsers: mau,
      retentionRate: retention,
      invitationsSent: inviteCount ?? 0,
      betaUsers: betaCount ?? 0,
      professionBreakdown: [...professionMap.entries()]
        .map(([profession, count]) => ({ profession, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    };
  }

  async getExecutiveBrainMetrics(): Promise<ExecutiveBrainSection> {
    const [
      { count: briefs },
      { count: decisions },
      { count: knowledge },
      { count: memory },
      { count: research },
      { count: docs },
      { count: intake },
      { data: dnaRows },
    ] = await Promise.all([
      this.client.from("executive_briefs").select("*", { count: "exact", head: true }),
      this.client.from("decision_items").select("*", { count: "exact", head: true }),
      this.client.from("knowledge").select("*", { count: "exact", head: true }),
      this.client.from("executive_memory").select("*", { count: "exact", head: true }),
      this.client.from("research_queue").select("*", { count: "exact", head: true }).eq("status", "Approved"),
      this.client.from("document_index").select("*", { count: "exact", head: true }),
      this.client.from("intake_items").select("*", { count: "exact", head: true }),
      this.client.from("executive_dna_profiles").select("overall_confidence"),
    ]);

    const avgConfidence =
      (dnaRows ?? []).reduce((sum, row) => sum + Number(row.overall_confidence ?? 0), 0) /
      Math.max((dnaRows ?? []).length, 1);

    return {
      briefsGenerated: briefs ?? 0,
      decisionQueueItemsCreated: decisions ?? 0,
      knowledgeItems: knowledge ?? 0,
      memoryEntries: memory ?? 0,
      executiveDnaAverageConfidence: Math.round(avgConfidence),
      researchCompleted: research ?? 0,
      documentsUnderstood: docs ?? 0,
      giveToKitaUploads: intake ?? 0,
    };
  }

  async getSecurityMetrics(): Promise<SecuritySection> {
    const since = daysAgoIso(30);
    const { data: rows } = await this.client
      .from("audit_logs")
      .select("event_type, metadata")
      .gte("created_at", since);

    const events = rows ?? [];
    const countType = (type: string) => events.filter((row) => row.event_type === type).length;

    const [{ count: failedLoginCount }] = await Promise.all([
      this.client.from("error_events").select("*", { count: "exact", head: true }).eq("source", "auth.login_failed"),
    ]);

    return {
      failedLogins: failedLoginCount ?? 0,
      rateLimitEvents: countType("rate_limited"),
      promptInjectionAttempts: events.filter(
        (row) => (row.metadata as { promptInjection?: boolean })?.promptInjection === true,
      ).length,
      apiAbuseEvents: countType("rate_limited"),
      suspiciousActivity: countType("rate_limited") + countType("deletion"),
      auditEvents: events.length,
    };
  }

  async getInfrastructureMetrics(): Promise<InfrastructureSection> {
    const [{ count: running }, { count: failed }, { count: pending }] = await Promise.all([
      this.client.from("sync_jobs").select("*", { count: "exact", head: true }).eq("status", "running"),
      this.client.from("sync_jobs").select("*", { count: "exact", head: true }).eq("status", "failed"),
      this.client.from("sync_jobs").select("*", { count: "exact", head: true }).eq("status", "queued"),
    ]);

    return {
      openaiStatus: isOpenAIConfigured() ? "operational" : "offline",
      supabaseStatus: isSupabaseConfigured() ? "operational" : "offline",
      googleStatus: isGoogleOAuthConfigured() ? "operational" : "degraded",
      syncQueuePending: pending ?? 0,
      backgroundJobsRunning: running ?? 0,
      healthChecksPassing: isSupabaseConfigured(),
      databaseHealth: failed && failed > 5 ? "warning" : "healthy",
      storageUsageMb: 0,
    };
  }

  async getFeedbackSummary(): Promise<FeedbackHubSection> {
    const { data: rows } = await this.client
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const items = rows ?? [];
    const countType = (type: string) => items.filter((row) => row.feedback_type === type).length;
    const ratings = items.map((row) => row.rating).filter((value): value is number => value != null);
    const averageRating =
      ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

    const recent: FeedbackItem[] = items.slice(0, 8).map((row) => ({
      id: row.id as string,
      userId: (row.user_id as string | null) ?? null,
      type: row.feedback_type as string,
      rating: (row.rating as number | null) ?? null,
      message: row.message as string,
      createdAt: row.created_at as string,
    }));

    return {
      totalFeedback: items.length,
      voiceNotes: countType("voice_note"),
      screenshots: countType("screenshot"),
      bugReports: countType("bug"),
      featureRequests: countType("feature_request"),
      averageRating,
      recent,
    };
  }

  async getErrorCenterSummary(): Promise<ErrorCenterSection> {
    const { data: errors } = await this.client
      .from("error_events")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(20);

    const { count: failedJobs } = await this.client
      .from("sync_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    const { count: retryable } = await this.client
      .from("error_events")
      .select("*", { count: "exact", head: true })
      .eq("retryable", true)
      .eq("resolved", false);

    return {
      unhandledErrors: (errors ?? []).length,
      failedJobs: failedJobs ?? 0,
      syncFailures: failedJobs ?? 0,
      retryQueueSize: retryable ?? 0,
      recentErrors: (errors ?? []).slice(0, 8).map((row) => ({
        id: row.id as string,
        source: row.source as string,
        message: row.message as string,
        createdAt: row.created_at as string,
      })),
    };
  }

  async getBetaManagement(): Promise<BetaManagementSection> {
    const [{ data: users }, { count: pendingInvites }, { data: settings }] = await Promise.all([
      this.client.from("users").select("id, name, email, is_disabled, daily_ai_budget_usd, beta_notes, invited_at").order("created_at", { ascending: false }).limit(50),
      this.client.from("beta_invites").select("*", { count: "exact", head: true }).eq("status", "pending"),
      this.client.from("platform_settings").select("value").eq("key", "default_daily_ai_budget_usd").maybeSingle(),
    ]);

    const userIds = (users ?? []).map((user) => user.id as string);
    const { data: profiles } = userIds.length
      ? await this.client.from("executive_dna_profiles").select("user_id, profile").in("user_id", userIds)
      : { data: [] };

    const professionByUser = new Map<string, string>();
    for (const row of profiles ?? []) {
      professionByUser.set(
        row.user_id as string,
        String((row.profile as { profession?: string })?.profession ?? ""),
      );
    }

    const betaUsers: BetaUserRow[] = (users ?? []).map((user) => ({
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      profession: professionByUser.get(user.id as string) || null,
      isDisabled: Boolean(user.is_disabled),
      dailyAiBudgetUsd: Number(user.daily_ai_budget_usd ?? 5),
      betaNotes: (user.beta_notes as string | null) ?? null,
      invitedAt: (user.invited_at as string | null) ?? null,
    }));

    return {
      users: betaUsers,
      pendingInvites: pendingInvites ?? 0,
      defaultDailyAiBudgetUsd: Number(settings?.value ?? 5),
    };
  }

  async getAiUsageAggregates() {
    const dayStart = startOfDayIso();
    const monthStart = daysAgoIso(30);

    const { data: monthRows } = await this.client
      .from("ai_usage_events")
      .select("user_id, feature, estimated_cost_usd, response_time_ms, cached, error, created_at")
      .gte("created_at", monthStart);

    const rows = monthRows ?? [];
    const todayRows = rows.filter((row) => row.created_at >= dayStart);

    const sumCost = (items: typeof rows) =>
      items.reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);

    const userCosts = new Map<string, number>();
    const featureCosts = new Map<string, number>();
    let cacheHits = 0;
    let errors = 0;
    let responseTotal = 0;
    let responseCount = 0;

    for (const row of rows) {
      if (row.user_id) userCosts.set(row.user_id as string, (userCosts.get(row.user_id as string) ?? 0) + Number(row.estimated_cost_usd ?? 0));
      featureCosts.set(row.feature as string, (featureCosts.get(row.feature as string) ?? 0) + Number(row.estimated_cost_usd ?? 0));
      if (row.cached) cacheHits += 1;
      if (row.error) errors += 1;
      if (row.response_time_ms) {
        responseTotal += Number(row.response_time_ms);
        responseCount += 1;
      }
    }

    const { count: briefCount } = await this.client
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("resource", "executive_briefs")
      .gte("created_at", monthStart);

    const { count: intakeCount } = await this.client
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .like("action", "delegate_%")
      .gte("created_at", monthStart);

    const topUserEntry = [...userCosts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topFeatureEntry = [...featureCosts.entries()].sort((a, b) => b[1] - a[1])[0];

    let topUserEmail: string | undefined;
    if (topUserEntry?.[0]) {
      const { data: userRow } = await this.client.from("users").select("email").eq("id", topUserEntry[0]).maybeSingle();
      topUserEmail = userRow?.email as string | undefined;
    }

    return {
      todayCost: sumCost(todayRows),
      monthCost: sumCost(rows),
      requests: rows.length,
      errors,
      avgResponseMs: responseCount > 0 ? Math.round(responseTotal / responseCount) : 0,
      cacheHits,
      totalCalls: rows.length,
      byUser: [...userCosts.entries()].map(([userId, cost]) => ({ userId, cost, email: topUserEntry?.[0] === userId ? topUserEmail : undefined })),
      byFeature: [...featureCosts.entries()].map(([feature, cost]) => ({ feature, cost })),
      briefCount: briefCount ?? 0,
      intakeCount: intakeCount ?? 0,
      topUserEmail,
      topFeature: topFeatureEntry?.[0] ?? null,
      topUserCost: topUserEntry?.[1] ?? 0,
    };
  }
}

export class MockAnalyticsRepository implements AnalyticsRepository {
  async getExecutiveSummary(): Promise<ExecutiveSummarySection> {
    return {
      activeUsers: 12,
      dailyActiveUsers: 5,
      weeklyActiveUsers: 9,
      monthlyActiveUsers: 12,
      retentionRate: 75,
      invitationsSent: 18,
      betaUsers: 12,
      professionBreakdown: [
        { profession: "CEO", count: 4 },
        { profession: "Founder", count: 3 },
        { profession: "COO", count: 2 },
      ],
    };
  }

  async getExecutiveBrainMetrics(): Promise<ExecutiveBrainSection> {
    return {
      briefsGenerated: 48,
      decisionQueueItemsCreated: 156,
      knowledgeItems: 89,
      memoryEntries: 34,
      executiveDnaAverageConfidence: 78,
      researchCompleted: 22,
      documentsUnderstood: 41,
      giveToKitaUploads: 17,
    };
  }

  async getSecurityMetrics(): Promise<SecuritySection> {
    return {
      failedLogins: 2,
      rateLimitEvents: 6,
      promptInjectionAttempts: 1,
      apiAbuseEvents: 3,
      suspiciousActivity: 4,
      auditEvents: 412,
    };
  }

  async getInfrastructureMetrics(): Promise<InfrastructureSection> {
    return {
      openaiStatus: "operational",
      supabaseStatus: "operational",
      googleStatus: "operational",
      syncQueuePending: 1,
      backgroundJobsRunning: 0,
      healthChecksPassing: true,
      databaseHealth: "healthy",
      storageUsageMb: 128,
    };
  }

  async getFeedbackSummary(): Promise<FeedbackHubSection> {
    return {
      totalFeedback: 7,
      voiceNotes: 1,
      screenshots: 2,
      bugReports: 2,
      featureRequests: 3,
      averageRating: 4.3,
      recent: [],
    };
  }

  async getErrorCenterSummary(): Promise<ErrorCenterSection> {
    return {
      unhandledErrors: 2,
      failedJobs: 1,
      syncFailures: 1,
      retryQueueSize: 1,
      recentErrors: [],
    };
  }

  async getBetaManagement(): Promise<BetaManagementSection> {
    return {
      users: [],
      pendingInvites: 3,
      defaultDailyAiBudgetUsd: 5,
    };
  }

  async getAiUsageAggregates() {
    return {
      todayCost: 0.42,
      monthCost: 12.8,
      requests: 320,
      errors: 3,
      avgResponseMs: 840,
      cacheHits: 24,
      totalCalls: 320,
      byUser: [],
      byFeature: [{ feature: "executive_brief", cost: 4.2 }],
      briefCount: 48,
      intakeCount: 17,
      topUserEmail: "beta@example.com",
      topFeature: "executive_brief",
      topUserCost: 2.1,
    };
  }
}
