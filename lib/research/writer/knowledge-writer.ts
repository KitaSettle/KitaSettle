import type { EntityId } from "@/lib/types/common";
import type { KnowledgeWriter, ResearchFinding } from "@/lib/types/live-research";
import type { LocalJsonStore } from "@/lib/types/live-research";
import { MockKnowledgeEngine } from "@/lib/knowledge/knowledge-engine";
import { nowIso } from "@/lib/utils";
import { localJsonStore } from "../store/local-json-store";

export class MockKnowledgeWriter implements KnowledgeWriter {
  constructor(
    private store: LocalJsonStore = localJsonStore,
    private knowledge = new MockKnowledgeEngine(),
  ) {}

  async writeApproved(finding: ResearchFinding): Promise<EntityId> {
    const knowledgeItem = await this.knowledge.create({
      title: finding.title,
      summary: finding.executiveSummary.summary,
      content: finding.cleanText,
      source: finding.sourceName,
      url: finding.url,
      category: finding.category,
      subcategory: finding.subcategory,
      confidence: finding.executiveSummary.confidence,
      publishedDate: finding.createdAt,
      lastReviewed: nowIso(),
      relatedItems: [],
      tags: finding.tags,
      importance: finding.executiveSummary.importance,
    });

    const approvedStore = await this.store.getApprovedKnowledge();
    const approvedFinding: ResearchFinding = {
      ...finding,
      status: "approved",
      updatedAt: nowIso(),
    };

    approvedStore.knowledgeIds.unshift(knowledgeItem.id);
    approvedStore.findings.unshift(approvedFinding);
    approvedStore.lastUpdated = nowIso();
    await this.store.saveApprovedKnowledge(approvedStore);

    const findingsStore = await this.store.getFindings();
    findingsStore.findings = findingsStore.findings.map((entry) =>
      entry.id === finding.id ? approvedFinding : entry,
    );
    findingsStore.lastUpdated = nowIso();
    await this.store.saveFindings(findingsStore);

    return knowledgeItem.id;
  }
}

export const knowledgeWriter = new MockKnowledgeWriter();
