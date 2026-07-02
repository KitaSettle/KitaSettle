import type { Repositories } from "@/lib/repositories";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { createGenerateBriefAction } from "@/lib/ai/generate-brief-action";
import { createBrainServices } from "@/lib/brain/create-brain-services";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import {
  DEFAULT_EXECUTIVE_DNA_PERSONALIZATION,
  DEFAULT_EXECUTIVE_DNA_STATUS,
  emptyRecommendations,
  withExecutiveDnaFallback,
} from "@/lib/executive-dna/defaults";
import { buildExecutiveConnectSnapshot } from "@/lib/integrations/connect-snapshot-service";
import {
  EMPTY_CONNECT_SNAPSHOT,
  withConnectFallback,
} from "@/lib/integrations/defaults";
import { createDecisionEngine } from "@/lib/decision-engine";
import {
  EMPTY_DECISION_QUEUE,
  withDecisionFallback,
} from "@/lib/decision-engine/defaults";
import { mapResearchQueueRecordToUi } from "@/lib/executive-brain/mappers";
import { isSameUtcDay } from "@/lib/utils/date";

export async function generateIfMissing(
  userId: string,
  repos: Repositories,
): Promise<DailyExecutiveBriefPayload> {
  const dnaEngine = createExecutiveDNAEngine(repos);
  const today = new Date();
  let brief = await repos.executiveBriefs.getBriefForDate(userId, today);
  let generatedToday = false;

  if (!brief) {
    const services = await createBrainServices(userId, undefined, { server: true });
    await createGenerateBriefAction(services, userId, repos).execute();
    brief = await repos.executiveBriefs.getBriefForDate(userId, today);
    generatedToday = Boolean(brief);
  }

  if (!brief) {
    brief = await repos.executiveBriefs.getLatestBrief(userId);
  }

  if (!brief) {
    throw new Error("Unable to load or generate today's executive brief.");
  }

  if (!generatedToday) {
    generatedToday = isSameUtcDay(brief.updatedAt, today);
  }

  const [research, trustedSources] = await Promise.all([
    repos.researchQueue.list(userId),
    repos.trustedSources.list(),
  ]);

  const [status, personalization, recommendations, connect] = await Promise.all([
    withExecutiveDnaFallback(
      () => dnaEngine.getStatus(userId),
      DEFAULT_EXECUTIVE_DNA_STATUS,
    ),
    withExecutiveDnaFallback(
      () => dnaEngine.personalizationService.getHints(userId),
      DEFAULT_EXECUTIVE_DNA_PERSONALIZATION,
    ),
    withExecutiveDnaFallback(
      () => dnaEngine.recommendationService.list(userId),
      emptyRecommendations(),
    ),
    withConnectFallback(
      () => buildExecutiveConnectSnapshot(userId, repos),
      EMPTY_CONNECT_SNAPSHOT,
    ),
  ]);

  if (status.interviewComplete) {
    await withExecutiveDnaFallback(async () => {
      await dnaEngine.refreshIntelligence(userId);
      await dnaEngine.learningService.observeBriefUsage(userId);
    }, undefined);
  }

  const personalizedBrief = dnaEngine.personalizationService.applyToBrief(
    brief,
    personalization,
  );

  const decisions = await withDecisionFallback(
    () => createDecisionEngine(repos).generateMorningQueue(userId, connect),
    EMPTY_DECISION_QUEUE,
  );

  const recentResearch = research
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map(mapResearchQueueRecordToUi);

  const pendingApprovals = research
    .filter((item) => item.status === "Ready")
    .map(mapResearchQueueRecordToUi);

  return {
    brief: personalizedBrief,
    recentResearch,
    pendingApprovals,
    trustedSourcesCount: trustedSources.length,
    generatedToday,
    dna: {
      status,
      personalization,
      recommendations,
    },
    connect,
    decisions,
  };
}
