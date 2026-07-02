import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { Badge } from "@/components/ui/Badge";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "./ActionCard";
import { ExecutiveBriefCard } from "./ExecutiveBriefCard";
import { OpportunityCard } from "./OpportunityCard";
import { PendingApprovalCard } from "./PendingApprovalCard";
import { PriorityCard } from "./PriorityCard";
import { ResearchCard } from "./ResearchCard";
import { RiskCard } from "./RiskCard";

interface ExecutiveDailyContentProps {
  name: string;
  data: DailyExecutiveBriefPayload;
}

function formatLastUpdated(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExecutiveDailyContent({ name, data }: ExecutiveDailyContentProps) {
  const { brief, recentResearch, pendingApprovals, trustedSourcesCount, generatedToday } =
    data;

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader name={name} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="default">Confidence {brief.confidenceScore}%</Badge>
        <Badge variant="default">Last updated {formatLastUpdated(brief.updatedAt)}</Badge>
        <Badge variant="default">{trustedSourcesCount} trusted sources monitored</Badge>
        {generatedToday && <Badge variant="default">Generated today</Badge>}
      </div>

      <div className="space-y-6">
        <ExecutiveBriefCard brief={brief} generatedToday={generatedToday} />

        <div className="grid gap-6 md:grid-cols-2">
          <PriorityCard priorities={brief.priorities} />
          <PendingApprovalCard items={pendingApprovals} />
          <RiskCard risks={brief.risks} />
          <OpportunityCard opportunities={brief.opportunities} />
          <ActionCard actions={brief.aiPrepared} />
          <ResearchCard items={recentResearch} />
        </div>
      </div>
    </div>
  );
}
