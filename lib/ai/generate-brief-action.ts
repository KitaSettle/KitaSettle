import type { BrainServices } from "@/lib/types/brain";
import type { ExecutiveBriefOutput } from "@/lib/types/executive";
import type { AIExecutiveBriefOutput } from "./types";
import { mockCalendarEvents, mockExecutiveTasks } from "@/lib/executive/mock-executive-inputs";
import { executiveBriefHistoryStore } from "./brief-history-store";

export function mapAIBriefToExecutiveBriefOutput(
  brief: AIExecutiveBriefOutput,
): ExecutiveBriefOutput {
  return {
    id: brief.id,
    headline: brief.headline,
    executiveSummary: brief.executiveSummary,
    summary: brief.executiveSummary,
    topPriorities: brief.topPriorities,
    risks: brief.risks,
    opportunities: brief.opportunities,
    recommendedActions: brief.recommendedActions,
    recommendedFocus: brief.recommendedActions[0] ?? brief.headline,
    estimatedReadingSaved: brief.estimatedReadingSaved,
    estimatedWorkload: brief.estimatedReadingSaved,
    confidence: brief.confidence,
    confidenceScore: brief.confidence,
    topicsUsed: brief.topicsUsed,
    generatedAt: brief.generatedAt,
  };
}

export class GenerateBriefAction {
  constructor(private services: BrainServices) {}

  async execute(): Promise<ExecutiveBriefOutput> {
    const [research, knowledge, memory] = await Promise.all([
      this.services.researchQueue.list(),
      this.services.knowledge.getAll(),
      this.services.memory.getAll(),
    ]);

    const aiBrief = await this.services.providers.ai.generateExecutiveBrief({
      research,
      knowledge,
      memory,
      calendar: mockCalendarEvents,
      tasks: mockExecutiveTasks,
    });

    await executiveBriefHistoryStore.saveBrief(aiBrief);

    return mapAIBriefToExecutiveBriefOutput(aiBrief);
  }
}

export function createGenerateBriefAction(services: BrainServices): GenerateBriefAction {
  return new GenerateBriefAction(services);
}
