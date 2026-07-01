import type { EntityId } from "@/lib/types/common";
import type { KnowledgeWriter, ResearchFinding } from "@/lib/types/live-research";
import { createKnowledgeEngine } from "@/lib/knowledge/knowledge-engine";
import { nowIso } from "@/lib/utils";

export class KnowledgeWriterImpl implements KnowledgeWriter {
  constructor(private userId: string) {}

  async writeApproved(finding: ResearchFinding): Promise<EntityId> {
    const knowledge = await createKnowledgeEngine(this.userId);
    const knowledgeItem = await knowledge.create({
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

    return knowledgeItem.id;
  }
}

export function createKnowledgeWriter(userId: string): KnowledgeWriterImpl {
  return new KnowledgeWriterImpl(userId);
}

export async function createKnowledgeWriterForSystem(): Promise<KnowledgeWriterImpl> {
  const { getSystemUserId } = await import("@/lib/system-user");
  return createKnowledgeWriter(await getSystemUserId());
}
