import type {
  ExecutiveBriefGenerator,
  ExecutiveBriefInput,
  ExecutiveBriefOutput,
} from "@/lib/types/executive";
import { mapAIBriefToExecutiveBriefOutput } from "@/lib/ai/generate-brief-action";
import { getAIProvider } from "@/lib/ai/get-ai-provider";
import { createId } from "@/lib/utils";

export class MockExecutiveBriefGenerator implements ExecutiveBriefGenerator {
  async generate(input: ExecutiveBriefInput): Promise<ExecutiveBriefOutput> {
    const aiBrief = await getAIProvider().generateExecutiveBrief({
      knowledge: input.knowledge,
      memory: input.memory,
      research: input.research,
      calendar: input.calendar,
      tasks: input.tasks,
    });

    return mapAIBriefToExecutiveBriefOutput(aiBrief);
  }
}

export const executiveBriefGenerator = new MockExecutiveBriefGenerator();

export function mapBriefOutputToLegacyBrief(
  output: ExecutiveBriefOutput,
): import("@/lib/types/ui").ExecutiveBrief {
  return {
    summary: output.executiveSummary,
    confidenceScore: output.confidenceScore,
    recommendedFocus: output.recommendedFocus,
    priorities: output.topPriorities,
    decisions: output.topPriorities.slice(0, 2).map((item) => ({
      id: createId("dec"),
      title: item.title,
      status: "needs-approval" as const,
    })),
    risks: output.risks,
    opportunities: output.opportunities,
    aiPrepared: output.recommendedActions.map((action, index) => ({
      id: createId(`prep-${index}`),
      title: action,
      description: output.topPriorities[index]?.description ?? "",
    })),
    workloadEstimate: output.estimatedReadingSaved,
  };
}
