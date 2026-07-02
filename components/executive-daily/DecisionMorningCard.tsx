"use client";

import { useState } from "react";
import type { DecisionItem, DecisionQueuePayload } from "@/lib/types/decision-engine";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DecisionMorningCardProps {
  queue: DecisionQueuePayload;
}

function DecisionActionItem({ item }: { item: DecisionItem }) {
  async function sendAction(action: "completed" | "ignored" | "delayed" | "rejected") {
    await fetch(`/api/decisions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: `User marked decision as ${action}.` }),
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{item.actionLabel}</p>
          <p className="mt-1 text-sm text-muted">{item.explanation}</p>
        </div>
        <Badge variant="default">Confidence {item.confidence}%</Badge>
      </div>

      {item.because.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Because</p>
          <ul className="mt-2 space-y-1">
            {item.because.map((reason) => (
              <li key={reason} className="text-sm text-foreground">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => void sendAction("completed")}>
          Done
        </Button>
        <Button variant="ghost" onClick={() => void sendAction("delayed")}>
          Delay
        </Button>
        <Button variant="ghost" onClick={() => void sendAction("ignored")}>
          Ignore
        </Button>
      </div>
    </li>
  );
}

export function DecisionMorningCard({ queue }: DecisionMorningCardProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? queue.allDecisions : queue.topActions;
  const hiddenCount = Math.max(queue.allDecisions.length - queue.topActions.length, 0);

  return (
    <SectionCard
      title="This Morning's Decisions"
      subtitle="Only what deserves your attention — ranked by impact, urgency, and strategic value"
      className="md:col-span-2"
    >
      {visible.length === 0 ? (
        <p className="text-sm text-muted">No high-value decisions queued for today.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => (
            <DecisionActionItem key={item.id} item={item} />
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <div className="mt-4">
          <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show top decisions only" : `View all (${queue.allDecisions.length})`}
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
