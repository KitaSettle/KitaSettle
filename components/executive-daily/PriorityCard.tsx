import type { Priority } from "@/lib/types";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface PriorityCardProps {
  priorities: Priority[];
}

export function PriorityCard({ priorities }: PriorityCardProps) {
  return (
    <SectionCard title="Today's Priorities" subtitle="What matters most today">
      <ol className="space-y-4">
        {priorities.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
