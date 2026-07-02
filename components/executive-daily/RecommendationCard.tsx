import type { ExecutiveDNARecommendation } from "@/lib/types/executive-dna";
import { Card } from "@/components/ui/Card";

interface RecommendationCardProps {
  recommendations: ExecutiveDNARecommendation[];
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (recommendations.length === 0) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-foreground">Recommendations</h2>
      <p className="mt-1 text-sm text-muted">
        Personalized suggestions based on your Executive DNA profile.
      </p>
      <ul className="mt-4 space-y-3">
        {recommendations.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
          >
            {item.recommendation}
          </li>
        ))}
      </ul>
    </Card>
  );
}
