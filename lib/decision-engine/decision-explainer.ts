import type { DecisionCandidate } from "@/lib/types/decision-engine";
import { isOpenAIConfigured } from "@/lib/config/env";
import { getOpenAIClient, getOpenAIModel } from "@/lib/ai/openai-client";

export class DecisionExplainer {
  async explain(
    candidate: DecisionCandidate & { score: number; confidence: number },
  ): Promise<{ explanation: string; because: string[] }> {
    const ruleBased = this.buildRuleBasedExplanation(candidate);
    if (!isOpenAIConfigured()) return ruleBased;

    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: getOpenAIModel(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Explain WHY this executive should take this action today. Return JSON with keys explanation (one sentence) and because (array of 2-4 short bullet reasons). Focus on impact, urgency, risk, dependencies, and financial effect.",
          },
          {
            role: "user",
            content: JSON.stringify({
              action: candidate.actionLabel,
              title: candidate.title,
              source: candidate.source,
              score: candidate.score,
              confidence: candidate.confidence,
              factors: candidate.factors,
              metadata: candidate.metadata,
            }),
          },
        ],
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { explanation?: string; because?: string[] };
      return {
        explanation: parsed.explanation ?? ruleBased.explanation,
        because: parsed.because?.length ? parsed.because : ruleBased.because,
      };
    } catch {
      return ruleBased;
    }
  }

  private buildRuleBasedExplanation(
    candidate: DecisionCandidate & { score: number; confidence: number },
  ): { explanation: string; because: string[] } {
    const because: string[] = [];
    const { factors, metadata } = candidate;

    if (factors.urgency >= 85) because.push("Time-sensitive — action is needed soon.");
    if (factors.financialEffect >= 80) because.push("High financial impact if delayed.");
    if (factors.dependencies >= 65) because.push("Blocks or unlocks downstream work.");
    if (factors.risk >= 70) because.push("Material risk exposure if ignored.");
    if (factors.strategicImportance >= 75) because.push("Aligns with your strategic priorities.");
    if (metadata?.dueAt && typeof metadata.dueAt === "string") {
      const hours = (new Date(metadata.dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hours <= 24) because.push("Deadline is within 24 hours.");
      else if (hours <= 72) because.push("Deadline approaching within three days.");
    }
    if (metadata?.classification === "approvals") because.push("Waiting on your approval to proceed.");
    if (because.length === 0) because.push("High decision score relative to today's alternatives.");

    return {
      explanation: `${candidate.actionLabel} ranks among today's highest-value executive moves.`,
      because: because.slice(0, 4),
    };
  }
}
