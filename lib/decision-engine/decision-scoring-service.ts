import type {
  DecisionCandidate,
  DecisionFactorWeights,
  DecisionFactors,
} from "@/lib/types/decision-engine";

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export class DecisionScoringService {
  scoreCandidate(factors: DecisionFactors, weights: DecisionFactorWeights): number {
    const weighted =
      factors.impact * weights.impact +
      factors.urgency * weights.urgency +
      factors.risk * weights.risk +
      factors.confidence * weights.confidence +
      factors.dependencies * weights.dependencies +
      (100 - factors.estimatedTime) * weights.estimatedTime +
      (100 - factors.energyRequired) * weights.energyRequired +
      factors.financialEffect * weights.financialEffect +
      factors.strategicImportance * weights.strategicImportance;

    return clamp(weighted);
  }

  scoreCandidates(
    candidates: DecisionCandidate[],
    weights: DecisionFactorWeights,
  ): Array<DecisionCandidate & { score: number; confidence: number }> {
    return candidates
      .map((candidate) => ({
        ...candidate,
        score: this.scoreCandidate(candidate.factors, weights),
        confidence: clamp(candidate.factors.confidence),
      }))
      .sort((a, b) => b.score - a.score);
  }
}

export class DecisionScoreEngine {
  private scoring = new DecisionScoringService();

  scoreCandidates(
    candidates: DecisionCandidate[],
    weights: DecisionFactorWeights,
  ): Array<DecisionCandidate & { score: number; confidence: number }> {
    return this.scoring.scoreCandidates(candidates, weights);
  }

  scoreFactors(factors: DecisionFactors, weights: DecisionFactorWeights): number {
    return this.scoring.scoreCandidate(factors, weights);
  }
}
