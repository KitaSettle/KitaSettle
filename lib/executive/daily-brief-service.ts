import type { Repositories } from "@/lib/repositories";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { createGenerateBriefAction } from "@/lib/ai/generate-brief-action";
import { createBrainServices } from "@/lib/brain/create-brain-services";
import { mapResearchQueueRecordToUi } from "@/lib/executive-brain/mappers";
import { isSameUtcDay } from "@/lib/utils/date";

export async function generateIfMissing(
  userId: string,
  repos: Repositories,
): Promise<DailyExecutiveBriefPayload> {
  const today = new Date();
  let brief = await repos.executiveBriefs.getBriefForDate(userId, today);
  let generatedToday = false;

  if (!brief) {
    const services = await createBrainServices(userId, undefined, { server: true });
    await createGenerateBriefAction(services, userId).execute();
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

  const recentResearch = research
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map(mapResearchQueueRecordToUi);

  const pendingApprovals = research
    .filter((item) => item.status === "Ready")
    .map(mapResearchQueueRecordToUi);

  return {
    brief,
    recentResearch,
    pendingApprovals,
    trustedSourcesCount: trustedSources.length,
    generatedToday,
  };
}
