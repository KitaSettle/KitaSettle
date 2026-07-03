import type { BrainOverviewMetrics } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ExecutiveBrainOverviewProps {
  metrics: BrainOverviewMetrics;
  isEmpty?: boolean;
}

const metricCards: {
  key: keyof BrainOverviewMetrics;
  label: string;
  format: (metrics: BrainOverviewMetrics, isEmpty?: boolean) => string;
  accent?: "default" | "success";
}[] = [
  {
    key: "knowledgeItems",
    label: "Knowledge Items",
    format: (metrics) => metrics.knowledgeItems.toLocaleString(),
  },
  {
    key: "executiveMemories",
    label: "Executive Memories",
    format: (metrics) => metrics.executiveMemories.toLocaleString(),
  },
  {
    key: "skills",
    label: "Skills",
    format: (metrics) => metrics.skills.toLocaleString(),
  },
  {
    key: "trustedSources",
    label: "Trusted Sources",
    format: (metrics) => metrics.trustedSources.toLocaleString(),
  },
  {
    key: "researchWaiting",
    label: "Research Waiting",
    format: (metrics) => metrics.researchWaiting.toLocaleString(),
  },
  {
    key: "brainHealth",
    label: "Brain Health",
    format: (metrics, isEmpty) =>
      isEmpty || metrics.brainHealth <= 0 ? "Getting Started" : `${metrics.brainHealth}%`,
    accent: "success",
  },
  {
    key: "estimatedTimeSavedHours",
    label: "Estimated Time Saved This Week",
    format: (metrics, isEmpty) =>
      isEmpty || metrics.estimatedTimeSavedHours <= 0
        ? "—"
        : `${metrics.estimatedTimeSavedHours} hours`,
  },
];

export function ExecutiveBrainOverview({ metrics, isEmpty }: ExecutiveBrainOverviewProps) {
  const brainHealthLabel =
    isEmpty || metrics.brainHealth <= 0 ? "Getting Started" : `${metrics.brainHealth}% brain health`;

  return (
    <Card className="mb-6 border-accent/10 bg-gradient-to-br from-surface to-accent/[0.03] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Executive Brain Overview</h2>
          <p className="mt-1 text-sm text-muted">
            {isEmpty
              ? "Your Executive Brain is ready — complete Discovery or upload your first document to begin learning."
              : "Your knowledge engine at a glance"}
          </p>
        </div>
        <Badge variant={isEmpty || metrics.brainHealth <= 0 ? "default" : "success"}>
          {brainHealthLabel}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-surface/80 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {metric.label}
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight ${
                metric.accent === "success" && !isEmpty && metrics.brainHealth > 0
                  ? "text-success"
                  : "text-foreground"
              }`}
            >
              {metric.format(metrics, isEmpty)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
