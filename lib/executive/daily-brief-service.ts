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
import { buildPersonalizedStarterBrief } from "@/lib/executive/personalized-starter-brief";
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
  const discoveryStatus = await withExecutiveDnaFallback(
    () => dnaEngine.getStatus(userId),
    DEFAULT_EXECUTIVE_DNA_STATUS,
  );

  if (!discoveryStatus.interviewComplete) {
    throw new Error("Complete your First Conversation before opening Today.");
  }

  const today = new Date();
  let brief = await repos.executiveBriefs.getBriefForDate(userId, today);
  let generatedToday = false;

  if (!brief) {
    try {
      const services = await createBrainServices(userId, undefined, { server: true });
      await createGenerateBriefAction(services, userId, repos).execute();
      brief = await repos.executiveBriefs.getBriefForDate(userId, today);
      generatedToday = Boolean(brief);
    } catch (error) {
      console.error("[KitaSettle] AI brief generation failed, using personalized starter:", error);
      const profile = await repos.executiveDna.ensureProfile(userId);
      const starter = buildPersonalizedStarterBrief(profile);
      brief = await repos.executiveBriefs.saveBrief(userId, starter);
      generatedToday = true;
    }
  }

  if (!brief) {
    brief = await repos.executiveBriefs.getLatestBrief(userId);
  }

  if (!brief) {
    const profile = await repos.executiveDna.ensureProfile(userId);
    brief = await repos.executiveBriefs.saveBrief(userId, buildPersonalizedStarterBrief(profile));
  }

  if (!generatedToday) {
    generatedToday = isSameUtcDay(brief.updatedAt, today);
  }

  const [research, trustedSources] = await Promise.all([
    repos.researchQueue.list(userId),
    repos.trustedSources.listForUser(userId),
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
    try {
      await withExecutiveDnaFallback(async () => {
        await dnaEngine.refreshIntelligence(userId);
        await dnaEngine.learningService.observeBriefUsage(userId);
      }, undefined);
    } catch (error) {
      console.error("[KitaSettle] Non-blocking brief intelligence refresh failed:", error);
    }
  }

  const personalizedBrief = dnaEngine.personalizationService.applyToBrief(
    brief,
    personalization,
  );
  const briefWithHeadline = {
    ...personalizedBrief,
    headline:
      personalizedBrief.summary?.split(".")[0]?.trim() ||
      "Good morning — I'm ready to start learning with you",
  };

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
    brief: briefWithHeadline,
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
