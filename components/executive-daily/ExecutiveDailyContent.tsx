"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import type { DecisionTimelinePayload } from "@/lib/types/decision-engine";
import { Button } from "@/components/ui/Button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActionCard } from "./ActionCard";
import { ConnectStatusCard } from "./ConnectStatusCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { DecisionMorningCard } from "./DecisionMorningCard";
import { DecisionTimelineCard } from "./DecisionTimelineCard";
import { GiveToKita } from "@/components/intake/GiveToKita";
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

export function ExecutiveDailyContent({ name, data }: ExecutiveDailyContentProps) {
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [timeline, setTimeline] = useState<DecisionTimelinePayload | null>(null);
  const {
    brief,
    recentResearch,
    pendingApprovals,
    dna,
    connect,
    decisions,
  } = data;

  const refreshTimeline = useCallback(async () => {
    const response = await fetch("/api/decisions/timeline");
    if (response.ok) {
      setTimeline((await response.json()) as DecisionTimelinePayload);
    }
  }, []);

  const handleDecisionAction = useCallback(async () => {
    await refreshTimeline();
  }, [refreshTimeline]);

  useEffect(() => {
    if (searchParams.get("connected") === "google") {
      setNotice("Google connected. Your brief will include calendar and email context.");
    } else if (searchParams.get("connectError")) {
      setNotice("We couldn't connect Google. Please try again from Executive Connect.");
    } else if (searchParams.get("notice") === "admin-only") {
      setNotice("Mission Control is limited to KitaSettle administrators.");
    }

    if (searchParams.get("connected") || searchParams.get("connectError") || searchParams.get("notice")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  const openAll = useCallback(async () => {
    setShowAll(true);
    if (!timeline) await refreshTimeline();
  }, [timeline, refreshTimeline]);

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader name={name} />

      {notice && (
        <p className="mb-6 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground" role="status">
          {notice}
        </p>
      )}

      <div className="space-y-8">
        <GiveToKita />
        <DecisionMorningCard queue={decisions} onAction={handleDecisionAction} />

        {!showAll && (
          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => void openAll()}>
              View all
            </Button>
          </div>
        )}

        {showAll && (
          <>
            <ExecutiveBriefCard brief={brief} generatedToday={data.generatedToday} />
            {timeline && <DecisionTimelineCard entries={timeline.entries} />}

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
