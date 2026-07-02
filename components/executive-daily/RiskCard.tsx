import type { Risk } from "@/lib/types";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface RiskCardProps {
  risks: Risk[];
}

export function RiskCard({ risks }: RiskCardProps) {
  return (
    <SectionCard title="Risks" subtitle="Worth monitoring" accent="warning">
      <ul className="space-y-3">
        {risks.map((item) => (
          <li key={item.id} className="flex gap-3 text-sm text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
            {item.title}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
