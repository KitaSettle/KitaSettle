"use client";

import { useState } from "react";
import type { DecisionItem, DecisionLearningEventType, DecisionQueuePayload } from "@/lib/types/decision-engine";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { buildDecisionTransparency } from "@/lib/transparency/build-transparency";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WhyPanel } from "@/components/transparency/WhyPanel";

interface DecisionMorningCardProps {
  queue: DecisionQueuePayload;
  onAction?: () => void;
}

function DecisionActionItem({
  item,
  compact = false,
  onAction,
}: {
  item: DecisionItem;
  compact?: boolean;
  onAction?: () => void;
}) {
  async function sendAction(action: DecisionLearningEventType) {
    await fetch(`/api/decisions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: `User marked decision as ${action}.` }),
    });
    onAction?.();
  }

  const transparency = buildDecisionTransparency(item);

  return (
    <li className={`rounded-2xl border border-border bg-background ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
            {item.actionLabel}
          </p>
          {!compact && <p className="mt-1 text-sm text-muted">{item.explanation}</p>}
        </div>
        <Badge variant="default">Confidence {item.confidence}%</Badge>
      </div>

      <WhyPanel transparency={transparency} className="mt-2" />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => void sendAction("accepted")}>
          Accept
        </Button>
        <Button variant="ghost" onClick={() => void sendAction("completed")}>
          Done
        </Button>
        <Button variant="ghost" onClick={() => void sendAction("delayed")}>
          Delay
        </Button>
        <Button variant="ghost" onClick={() => void sendAction("dismissed")}>
          Dismiss
        </Button>
      </div>
    </li>
  );
}

export function DecisionMorningCard({ queue, onAction }: DecisionMorningCardProps) {
  const [showAll, setShowAll] = useState(false);
  const topDecision = queue.topDecision;
  const secondaryActions = queue.topActions.filter((item) => item.id !== topDecision?.id);
  const expanded = showAll
    ? queue.allDecisions.filter((item) => item.id !== topDecision?.id)
    : secondaryActions;
  const hiddenCount = Math.max(queue.allDecisions.length - queue.topActions.length, 0);

  return (
    <div className="space-y-6">
      {topDecision ? (
        <SectionCard
          title="Today's Top Decision"
          subtitle="The single highest-value move for your attention right now"
          className="md:col-span-2"
        >
          <DecisionActionItem item={topDecision} onAction={onAction} />
        </SectionCard>
      ) : (
        <SectionCard
          title="Today's Top Decision"
          subtitle="The platform will surface your highest-value move once inputs are available"
        >
          <EmptyState>{KITA_EMPTY.decisions}</EmptyState>
        </SectionCard>
      )}

      {(secondaryActions.length > 0 || (showAll && queue.allDecisions.length > 1)) && (
        <SectionCard
          title="Top Recommended Actions"
          subtitle="Three more decisions ranked by impact, urgency, and strategic value"
          className="md:col-span-2"
        >
          <ul className="space-y-4">
            {expanded.map((item) => (
              <DecisionActionItem key={item.id} item={item} compact onAction={onAction} />
            ))}
          </ul>

          {hiddenCount > 0 && (
            <div className="mt-4">
              <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show recommended only" : `View all (${queue.allDecisions.length})`}
              </Button>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
