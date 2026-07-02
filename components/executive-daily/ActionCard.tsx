import type { PreparedItem } from "@/lib/types";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface ActionCardProps {
  actions: PreparedItem[];
}

export function ActionCard({ actions }: ActionCardProps) {
  return (
    <SectionCard title="Recommended Actions" subtitle="Prepared for your review" className="md:col-span-2">
      <ul className="grid gap-4 sm:grid-cols-2">
        {actions.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-surface-muted/40 p-4"
          >
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
