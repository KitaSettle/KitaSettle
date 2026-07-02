import type { ExecutiveDNARecommendation } from "@/lib/types/executive-dna";
import { buildRecommendationTransparency } from "@/lib/transparency/build-transparency";
import { Card } from "@/components/ui/Card";
import { WhyPanel } from "@/components/transparency/WhyPanel";

interface RecommendationCardProps {
  recommendations: ExecutiveDNARecommendation[];
}

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (recommendations.length === 0) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-foreground">Suggestions for you</h2>
      <p className="mt-1 text-sm text-muted">Ways to help Kita understand you even better.</p>
      <ul className="mt-4 space-y-4">
        {recommendations.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-border bg-background px-4 py-4 text-sm text-foreground"
          >
            <p>{item.recommendation}</p>
            <WhyPanel transparency={buildRecommendationTransparency(item)} className="mt-2" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
