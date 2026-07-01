import type { ResearchFinding, ResearchReviewer } from "@/lib/types/live-research";
import type { LocalJsonStore } from "@/lib/types/live-research";
import type { ResearchQueueService } from "@/lib/types/research";
import { createResearchQueueService } from "@/lib/brain/research-queue-service";
import { getSystemUserId } from "@/lib/system-user";
import { nowIso } from "@/lib/utils";
import { localJsonStore } from "../store/local-json-store";

export class ResearchReviewerImpl implements ResearchReviewer {
  constructor(
    private store: LocalJsonStore,
    private researchQueue: ResearchQueueService,
  ) {}

  async submitForReview(finding: ResearchFinding): Promise<ResearchFinding> {
    const stored = await this.store.getFindings();
    const readyFinding: ResearchFinding = {
      ...finding,
      status: "ready",
      updatedAt: nowIso(),
    };

    stored.findings.unshift(readyFinding);
    stored.lastUpdated = nowIso();
    await this.store.saveFindings(stored);

    const queueItem = await this.researchQueue.enqueue({
      title: readyFinding.title,
      summary: readyFinding.executiveSummary.summary,
      source: readyFinding.sourceName,
      sourceUrl: readyFinding.url,
      confidence: readyFinding.executiveSummary.confidence,
      importance: readyFinding.executiveSummary.importance,
      whyItMatters: readyFinding.executiveSummary.whyItMatters,
      tags: readyFinding.tags,
    });

    await this.researchQueue.updateStatus(queueItem.id, "Ready");

    return readyFinding;
  }

  async listPendingReview(): Promise<ResearchFinding[]> {
    const stored = await this.store.getFindings();
    return stored.findings.filter((finding) => finding.status === "pending_review");
  }

  async listReadyForApproval(): Promise<ResearchFinding[]> {
    const stored = await this.store.getFindings();
    return stored.findings.filter((finding) => finding.status === "ready");
  }
}

export async function createResearchReviewer(userId?: string): Promise<ResearchReviewerImpl> {
  const resolvedUserId = userId ?? (await getSystemUserId());
  const researchQueue = await createResearchQueueService(resolvedUserId);
  return new ResearchReviewerImpl(localJsonStore, researchQueue);
}
