import type { Opportunity } from "@/lib/types";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface OpportunityCardProps {
  opportunities: Opportunity[];
}

export function OpportunityCard({ opportunities }: OpportunityCardProps) {
  return (
    <SectionCard title="Opportunities" subtitle="Worth exploring" accent="success">
      <ul className="space-y-3">
        {opportunities.map((item) => (
          <li key={item.id} className="flex gap-3 text-sm text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            {item.title}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
