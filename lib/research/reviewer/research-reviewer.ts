import type { ResearchFinding, ResearchReviewer } from "@/lib/types/live-research";
import type { LocalJsonStore } from "@/lib/types/live-research";
import { researchQueueService } from "@/lib/brain/research-queue-service";
import { nowIso } from "@/lib/utils";
import { localJsonStore } from "../store/local-json-store";

export class MockResearchReviewer implements ResearchReviewer {
  constructor(private store: LocalJsonStore = localJsonStore) {}

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

    const queueItem = await researchQueueService.enqueue({
      title: readyFinding.title,
      summary: readyFinding.executiveSummary.summary,
      source: readyFinding.sourceName,
      sourceUrl: readyFinding.url,
      confidence: readyFinding.executiveSummary.confidence,
      importance: readyFinding.executiveSummary.importance,
      whyItMatters: readyFinding.executiveSummary.whyItMatters,
      tags: readyFinding.tags,
    });

    await researchQueueService.updateStatus(queueItem.id, "Ready");

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

export const researchReviewer = new MockResearchReviewer();
