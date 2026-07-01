import type { QuickAction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "./SectionCard";

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <SectionCard title="Quick Actions" subtitle="Worth your attention today">
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button key={action.id} variant="secondary">
            {action.label}
          </Button>
        ))}
      </div>
    </SectionCard>
  );
}
