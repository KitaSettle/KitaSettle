import type { ResearchQueueItem } from "@/lib/types";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface ResearchCardProps {
  items: ResearchQueueItem[];
}

export function ResearchCard({ items }: ResearchCardProps) {
  return (
    <SectionCard title="Recent Research" subtitle="Latest findings in your queue">
      <ul className="space-y-4">
        {items.length === 0 && (
          <li>
            <EmptyState>{KITA_EMPTY.research}</EmptyState>
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <Badge variant="default">{item.confidence}%</Badge>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
              {item.source}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
