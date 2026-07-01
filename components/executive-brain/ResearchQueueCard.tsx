import type { ResearchQueueItem } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ResearchQueueCardProps {
  item: ResearchQueueItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSaveToMemory: (id: string) => void;
}

const importanceVariant = {
  High: "warning",
  Medium: "default",
  Low: "muted",
} as const;

export function ResearchQueueCard({
  item,
  onApprove,
  onReject,
  onSaveToMemory,
}: ResearchQueueCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {item.source}
          </p>
          <h4 className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {item.title}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{item.confidence}% confidence</Badge>
          <Badge variant={importanceVariant[item.importance]}>
            {item.importance} importance
          </Badge>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground/90">
        {item.summary}
      </p>

      <div className="mt-4 rounded-xl bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Why it matters
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {item.whyItMatters}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => onApprove(item.id)}>
          Approve
        </Button>
        <Button variant="secondary" onClick={() => onReject(item.id)}>
          Reject
        </Button>
        <Button variant="ghost" onClick={() => onSaveToMemory(item.id)}>
          Save to Memory
        </Button>
      </div>
    </article>
  );
}
