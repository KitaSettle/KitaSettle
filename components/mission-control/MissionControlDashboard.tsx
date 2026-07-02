"use client";

import type { MetricValue, MissionControlPayload } from "@/lib/types/mission-control";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { useCallback, useEffect, useState } from "react";

function MetricGrid({ metrics }: { metrics: MetricValue[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border border-border/80 bg-background/80 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{metric.label}</dt>
          <dd className="mt-1 text-xl font-semibold text-foreground">{metric.value}</dd>
          {metric.hint && <p className="mt-1 text-xs text-muted">{metric.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "operational" || status === "healthy"
      ? "default"
      : status === "degraded" || status === "warning"
        ? "default"
        : "default";
  return <Badge variant={variant}>{status}</Badge>;
}

export function MissionControlDashboard() {
  const [data, setData] = useState<MissionControlPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/mission-control");
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Failed to load Mission Control");
    }
    setData((await response.json()) as MissionControlPayload);
  }, []);

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load");
    });
  }, [load]);

  async function inviteBetaUser() {
    if (!inviteEmail.trim()) return;
    await fetch("/api/admin/mission-control/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", email: inviteEmail.trim() }),
    });
    setInviteEmail("");
    await load();
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <KitaWorking context="missionControl" />;
  }

  const { executiveSummary: es, aiAnalytics: ai, executiveBrain: brain, security, infrastructure: infra, feedbackHub, errorCenter, financial, aiRoi, betaManagement } = data;

  return (
    <div className="space-y-8 kita-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Internal</p>
          <h1 className="font-display mt-2 text-3xl tracking-tight text-foreground sm:text-4xl">
            Mission Control
          </h1>
          <p className="mt-3 text-sm text-muted">Operational overview for administrators</p>
        </div>
        <Button variant="ghost" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <SectionCard title="1. Executive Summary" subtitle="Platform adoption and beta cohort">
        <MetricGrid
          metrics={[
            { label: "Active Users", value: es.activeUsers },
            { label: "DAU", value: es.dailyActiveUsers },
            { label: "WAU", value: es.weeklyActiveUsers },
            { label: "MAU", value: es.monthlyActiveUsers },
            { label: "Retention", value: `${es.retentionRate}%` },
            { label: "Invitations Sent", value: es.invitationsSent },
            { label: "Beta Users", value: es.betaUsers },
          ]}
        />
        {es.professionBreakdown.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Profession Breakdown</p>
            <ul className="mt-2 space-y-1 text-sm">
              {es.professionBreakdown.map((row) => (
                <li key={row.profession}>
                  {row.profession}: {row.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      <SectionCard title="2. AI Analytics" subtitle="Cost, usage, and performance">
        <MetricGrid
          metrics={[
            { label: "Today's AI Cost", value: `$${ai.todayAiCostUsd.toFixed(2)}` },
            { label: "Monthly AI Cost", value: `$${ai.monthlyAiCostUsd.toFixed(2)}` },
            { label: "Avg Cost / User", value: `$${ai.averageCostPerUserUsd.toFixed(2)}` },
            { label: "Avg Cost / Brief", value: `$${ai.averageCostPerBriefUsd.toFixed(2)}` },
            { label: "Avg Cost / Intake", value: `$${ai.averageCostPerIntakeUsd.toFixed(2)}` },
            { label: "Most Expensive User", value: ai.mostExpensiveUser ?? "—" },
            { label: "Most Expensive Feature", value: ai.mostExpensiveFeature ?? "—" },
            { label: "AI Requests", value: ai.aiRequests },
            { label: "Requests Avoided", value: ai.aiRequestsAvoided },
            { label: "Cache Hit Rate", value: `${ai.cacheHitRate}%` },
            { label: "Avg Response Time", value: `${ai.averageResponseTimeMs}ms` },
            { label: "AI Errors", value: ai.aiErrors },
          ]}
        />
      </SectionCard>

      <SectionCard title="3. Executive Brain" subtitle="Intelligence platform output">
        <MetricGrid
          metrics={[
            { label: "Briefs Generated", value: brain.briefsGenerated },
            { label: "Decision Items", value: brain.decisionQueueItemsCreated },
            { label: "Knowledge Items", value: brain.knowledgeItems },
            { label: "Memory Entries", value: brain.memoryEntries },
            { label: "DNA Avg Confidence", value: `${brain.executiveDnaAverageConfidence}%` },
            { label: "Research Completed", value: brain.researchCompleted },
            { label: "Documents Understood", value: brain.documentsUnderstood },
            { label: "Give this to Kita", value: brain.giveToKitaUploads },
          ]}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="4. Security">
          <MetricGrid
            metrics={[
              { label: "Failed Logins", value: security.failedLogins },
              { label: "Rate Limits", value: security.rateLimitEvents },
              { label: "Suspicious Inputs", value: security.promptInjectionAttempts },
              { label: "API Abuse", value: security.apiAbuseEvents },
              { label: "Suspicious Activity", value: security.suspiciousActivity },
              { label: "Audit Events", value: security.auditEvents },
            ]}
          />
        </SectionCard>

        <SectionCard title="5. Infrastructure">
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge status={infra.openaiStatus} />
            <StatusBadge status={infra.supabaseStatus} />
            <StatusBadge status={infra.googleStatus} />
            <StatusBadge status={infra.databaseHealth} />
          </div>
          <MetricGrid
            metrics={[
              { label: "Sync Queue", value: infra.syncQueuePending },
              { label: "Background Jobs", value: infra.backgroundJobsRunning },
              { label: "Health Checks", value: infra.healthChecksPassing ? "Passing" : "Failing" },
              { label: "Storage (MB)", value: infra.storageUsageMb },
            ]}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="6. Feedback Hub">
          <MetricGrid
            metrics={[
              { label: "Total Feedback", value: feedbackHub.totalFeedback },
              { label: "Voice Notes", value: feedbackHub.voiceNotes },
              { label: "Screenshots", value: feedbackHub.screenshots },
              { label: "Bug Reports", value: feedbackHub.bugReports },
              { label: "Feature Requests", value: feedbackHub.featureRequests },
              { label: "Avg Rating", value: feedbackHub.averageRating || "—" },
            ]}
          />
        </SectionCard>

        <SectionCard title="7. Error Center">
          <MetricGrid
            metrics={[
              { label: "Unhandled Errors", value: errorCenter.unhandledErrors },
              { label: "Failed Jobs", value: errorCenter.failedJobs },
              { label: "Sync Failures", value: errorCenter.syncFailures },
              { label: "Retry Queue", value: errorCenter.retryQueueSize },
            ]}
          />
          {errorCenter.recentErrors.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {errorCenter.recentErrors.map((item) => (
                <li key={item.id} className="rounded-lg border border-border p-2">
                  <span className="font-medium">{item.source}</span>: {item.message}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="8. Financial Dashboard">
          <MetricGrid
            metrics={[
              { label: "Est. Monthly Cost", value: `$${financial.estimatedMonthlyCostUsd.toFixed(2)}` },
              { label: "Est. Revenue (future)", value: `$${financial.estimatedMonthlyRevenueUsd.toFixed(2)}` },
              { label: "AI Gross Margin", value: `${financial.aiGrossMargin}%` },
              { label: "Projected Burn", value: `$${financial.projectedBurnUsd.toFixed(2)}` },
            ]}
          />
        </SectionCard>

        <SectionCard title="9. AI ROI">
          <MetricGrid
            metrics={[
              { label: "Hours Saved", value: aiRoi.estimatedHoursSaved },
              { label: "Min Saved / Brief", value: aiRoi.minutesSavedPerBrief },
              { label: "Min Saved / Upload", value: aiRoi.minutesSavedPerUpload },
              { label: "Productivity Gain", value: `${aiRoi.estimatedProductivityGainPercent}%` },
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard title="10. Beta Management" subtitle="Invite, limits, and notes">
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[240px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Invite email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <Button variant="primary" onClick={() => void inviteBetaUser()}>
            Invite User
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Pending invites: {betaManagement.pendingInvites} · Default daily AI budget: $
          {betaManagement.defaultDailyAiBudgetUsd}
        </p>
        {betaManagement.users.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Profession</th>
                  <th className="py-2 pr-4">Budget</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {betaManagement.users.slice(0, 10).map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="py-2 pr-4">
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td className="py-2 pr-4">{user.profession ?? "—"}</td>
                    <td className="py-2 pr-4">${user.dailyAiBudgetUsd}</td>
                    <td className="py-2">{user.isDisabled ? "Disabled" : "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
