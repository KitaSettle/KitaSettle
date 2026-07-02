import type { Repositories } from "@/lib/repositories";
import type { TransparencyRepository } from "@/lib/repositories/transparency-repository";
import type {
  TrustCenterPayload,
  TrustPermissionItem,
  TrustRelationshipMetrics,
} from "@/lib/types/trust-center";
import type { ConnectService, IntegrationStatusSummary } from "@/lib/types/executive-connect";
import { nowIso } from "@/lib/utils";

function formatSyncLabel(lastSyncAt: string | null): string {
  if (!lastSyncAt) return "Not synced yet";
  const date = new Date(lastSyncAt);
  const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (diffHours < 1) return "Synced recently";
  if (diffHours < 24) return "Synced today";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function buildGooglePermissions(integration: IntegrationStatusSummary | undefined): TrustPermissionItem[] {
  const services: Array<{ service: ConnectService; label: string }> = [
    { service: "calendar", label: "Calendar" },
    { service: "gmail", label: "Email" },
    { service: "drive", label: "Drive" },
  ];

  return services.map((entry) => ({
    id: `google-${entry.service}`,
    provider: "Google",
    service: entry.service,
    label: entry.label,
    connected: Boolean(integration?.connected && integration.services.includes(entry.service)),
    lastSyncAt: integration?.lastSyncAt ?? null,
    lastSyncLabel: formatSyncLabel(integration?.lastSyncAt ?? null),
    accountEmail: integration?.accountEmail ?? null,
    connectUrl: integration?.connected ? null : "/api/integrations/google/connect",
    disconnectAction: integration?.connected ? "google" : null,
  }));
}

export class TrustCenterService {
  constructor(
    private repos: Repositories,
    private transparency: TransparencyRepository,
  ) {}

  async getDashboard(userId: string): Promise<TrustCenterPayload> {
    const [meta, counts, integrations, profile] = await Promise.all([
      this.transparency.getUserMeta(userId),
      this.transparency.getCounts(userId),
      this.transparency.getIntegrations(userId),
      this.repos.executiveDna.ensureProfile(userId),
    ]);

    const google = integrations.find((item) => item.provider === "google");
    const permissions = [
      ...buildGooglePermissions(google),
      {
        id: "future-microsoft",
        provider: "Microsoft 365",
        service: "future" as const,
        label: "Future integration",
        connected: false,
        lastSyncAt: null,
        lastSyncLabel: "Coming soon",
        accountEmail: null,
        connectUrl: null,
        disconnectAction: null,
      },
    ];

    const createdAt = new Date(meta.createdAt);
    const daysTogether = Math.max(
      1,
      Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const relationship: TrustRelationshipMetrics = {
      daysTogether,
      daysTogetherLabel: `${daysTogether} day${daysTogether === 1 ? "" : "s"}`,
      documentsLearned: counts.documentsLearned,
      meetingsUnderstood: counts.meetingsUnderstood,
      projects: counts.projects,
      decisions: counts.decisions,
      estimatedHoursSaved: Math.max(
        1,
        Math.round(counts.documentsLearned * 0.5 + counts.decisions * 0.25 + counts.meetingsUnderstood * 0.1),
      ),
      executiveBrainConfidence: profile.overallConfidence,
      learningProgress:
        profile.overallConfidence >= 80
          ? "Kita knows you well and is refining the details."
          : "Kita is learning — every interaction helps.",
    };

    return {
      generatedAt: nowIso(),
      account: { name: meta.name, email: meta.email },
      relationship,
      permissions,
      exportFormats: ["json", "zip"],
    };
  }
}

export function createTrustCenterService(
  repos: Repositories,
  transparency: TransparencyRepository,
): TrustCenterService {
  return new TrustCenterService(repos, transparency);
}
