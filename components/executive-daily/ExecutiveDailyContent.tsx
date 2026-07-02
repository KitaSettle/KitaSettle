"use client";

import { useState } from "react";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "./ActionCard";
import { ConnectStatusCard } from "./ConnectStatusCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { DecisionMorningCard } from "./DecisionMorningCard";
import { DocumentsReviewCard } from "./DocumentsReviewCard";
import { ExecutiveBriefCard } from "./ExecutiveBriefCard";
import { ImportantEmailsCard } from "./ImportantEmailsCard";
import { OpportunityCard } from "./OpportunityCard";
import { PendingApprovalCard } from "./PendingApprovalCard";
import { PriorityCard } from "./PriorityCard";
import { RecommendationCard } from "./RecommendationCard";
import { ResearchCard } from "./ResearchCard";
import { RiskCard } from "./RiskCard";
import { TodayMeetingsCard } from "./TodayMeetingsCard";
import { TravelCard } from "./TravelCard";

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
  const [showAll, setShowAll] = useState(false);
  const {
    brief,
    recentResearch,
    pendingApprovals,
    trustedSourcesCount,
    generatedToday,
    dna,
    connect,
    decisions,
  } = data;

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader name={name} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="default">Confidence {brief.confidenceScore}%</Badge>
        <Badge variant="default">Last updated {formatLastUpdated(brief.updatedAt)}</Badge>
        <Badge variant="default">{trustedSourcesCount} trusted sources</Badge>
        {generatedToday && <Badge variant="default">Generated today</Badge>}
        {decisions.topActions.length > 0 && (
          <Badge variant="default">{decisions.topActions.length} decisions for today</Badge>
        )}
      </div>

      <div className="space-y-6">
        <DecisionMorningCard queue={decisions} />
        <ExecutiveBriefCard brief={brief} generatedToday={generatedToday} />

        {!showAll && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => setShowAll(true)}>
              View all
            </Button>
          </div>
        )}

        {showAll && (
          <>
            {dna?.personalization && (
              <div className="rounded-2xl border border-border bg-surface px-5 py-4">
                <p className="text-sm font-medium text-foreground">
                  {dna.personalization.professionLabel} priorities
                </p>
                <p className="mt-1 text-sm text-muted">{dna.personalization.priorityFocus}</p>
              </div>
            )}

            <ConnectStatusCard
              integrations={connect.integrations}
              googleConfigured={connect.googleConfigured}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <TodayMeetingsCard meetings={connect.todayMeetings} />
              <ImportantEmailsCard emails={connect.importantEmails} />
              <DeadlinesCard deadlines={connect.deadlines} />
              <TravelCard travel={connect.travel} />
              <DocumentsReviewCard documents={connect.documentsToReview} />
            </div>

            {dna?.recommendations && (
              <RecommendationCard recommendations={dna.recommendations} />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <PriorityCard priorities={brief.priorities} />
              <PendingApprovalCard items={pendingApprovals} />
              <RiskCard risks={brief.risks} />
              <OpportunityCard opportunities={brief.opportunities} />
              <ActionCard actions={brief.aiPrepared} />
              <ResearchCard items={recentResearch} />
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => setShowAll(false)}>
                Show decisions only
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
