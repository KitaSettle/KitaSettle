import type { ExecutiveBrief } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ExecutiveBriefCardProps {
  brief: Pick<
    ExecutiveBrief,
    "summary" | "confidenceScore" | "recommendedFocus" | "workloadEstimate"
  >;
}

export function ExecutiveBriefCard({ brief }: ExecutiveBriefCardProps) {
  return (
    <Card className="border-accent/10 bg-gradient-to-br from-surface to-accent/[0.03] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Today&apos;s Executive Brief
          </h2>
          <p className="mt-1 text-sm text-muted">Prepared for your review</p>
        </div>
        <Badge variant="default">{brief.confidenceScore}% confidence</Badge>
      </div>

      <p className="mt-6 text-base leading-relaxed text-foreground/90">
        {brief.summary}
      </p>

      <div className="mt-6 rounded-xl bg-surface-muted/80 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Recommended focus
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {brief.recommendedFocus}
        </p>
      </div>

      <p className="mt-6 text-sm text-muted">
        Estimated focus time today:{" "}
        <span className="font-medium text-foreground">{brief.workloadEstimate}</span>
      </p>
    </Card>
  );
}
