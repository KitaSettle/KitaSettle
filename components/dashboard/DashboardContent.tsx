import type { ExecutiveBrief } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { DashboardHeader } from "./DashboardHeader";
import { ExecutiveBriefCard } from "./ExecutiveBriefCard";
import { QuickActions } from "./QuickActions";
import { SectionCard } from "./SectionCard";

interface DashboardContentProps {
  name: string;
  brief: ExecutiveBrief;
  quickActions: { id: string; label: string }[];
}

export function DashboardContent({
  name,
  brief,
  quickActions,
}: DashboardContentProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader name={name} />

      <div className="space-y-6">
        <ExecutiveBriefCard brief={brief} />

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard title="Top 3 Priorities" subtitle="What matters most today">
            <ol className="space-y-4">
              {brief.priorities.map((item, index) => (
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

          <SectionCard
            title="Decisions Waiting"
            subtitle="Needs your approval"
          >
            <ul className="space-y-3">
              {brief.decisions.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted/60 p-3"
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <Badge variant="warning">Needs approval</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Risks" subtitle="Worth monitoring" accent="warning">
            <ul className="space-y-3">
              {brief.risks.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {item.title}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Opportunities"
            subtitle="Worth exploring"
            accent="success"
          >
            <ul className="space-y-3">
              {brief.opportunities.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {item.title}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Prepared for You"
            subtitle="Reviewed and ready"
            className="md:col-span-2"
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brief.aiPrepared.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-surface-muted/40 p-4"
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="md:col-span-2">
            <QuickActions actions={quickActions} />
          </div>
        </div>
      </div>
    </div>
  );
}
