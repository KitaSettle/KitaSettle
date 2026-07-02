"use client";

import type { DecisionTimelineEntry } from "@/lib/types/decision-engine";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/ui/Badge";

interface DecisionTimelineCardProps {
  entries: DecisionTimelineEntry[];
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DecisionTimelineCard({ entries }: DecisionTimelineCardProps) {
  return (
    <SectionCard
      title="Executive Timeline"
      subtitle="Why decisions were made, what happened next, and recorded outcomes"
      className="md:col-span-2"
    >
      {entries.length === 0 ? (
        <p className="text-sm text-muted">Decision history will appear here as you act on recommendations.</p>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{entry.actionLabel}</p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(entry.recordedAt)}</p>
                </div>
                <Badge variant="default">{entry.eventType}</Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <p>
                  <span className="font-medium text-muted">Why: </span>
                  {entry.whyMade}
                </p>
                {entry.outcome && (
                  <p>
                    <span className="font-medium text-muted">Outcome: </span>
                    {entry.outcome}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
