import type { BrainServices } from "@/lib/types/brain";
import type { Repositories } from "@/lib/repositories";
import type { CalendarEvent, ExecutiveBriefOutput } from "@/lib/types/executive";
import type { AIExecutiveBriefOutput } from "./types";
import { createExecutiveBriefHistoryStore } from "./brief-history-store";

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

async function loadCalendarEvents(userId: string, repos?: Repositories): Promise<CalendarEvent[]> {
  if (!repos) return [];

  const events = await repos.calendar.listToday(userId, "google");
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    category: event.category,
  }));
}

export class GenerateBriefAction {
  constructor(
    private services: BrainServices,
    private userId: string,
    private repos?: Repositories,
  ) {}

  async execute(): Promise<ExecutiveBriefOutput> {
    const [research, knowledge, memory, calendar] = await Promise.all([
      this.services.researchQueue.list(),
      this.services.knowledge.getAll(),
      this.services.memory.getAll(),
      loadCalendarEvents(this.userId, this.repos),
    ]);

    const aiBrief = await this.services.providers.ai.generateExecutiveBrief({
      research,
      knowledge,
      memory,
      calendar,
      tasks: [],
    });

    const historyStore = await createExecutiveBriefHistoryStore(this.userId, this.repos);
    await historyStore.saveBrief(aiBrief);

    return mapAIBriefToExecutiveBriefOutput(aiBrief);
  }
}

export function createGenerateBriefAction(
  services: BrainServices,
  userId: string,
  repos?: Repositories,
): GenerateBriefAction {
  return new GenerateBriefAction(services, userId, repos);
}
