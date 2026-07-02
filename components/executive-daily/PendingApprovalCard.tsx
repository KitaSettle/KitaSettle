import type { ResearchQueueItem } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface PendingApprovalCardProps {
  items: ResearchQueueItem[];
}

export function PendingApprovalCard({ items }: PendingApprovalCardProps) {
  return (
    <SectionCard
      title="Pending Approvals"
      subtitle="Research waiting for your decision"
      accent="warning"
    >
      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-muted">No research items waiting for approval.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted/60 p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.source}</p>
            </div>
            <Badge variant="warning">{item.importance}</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
