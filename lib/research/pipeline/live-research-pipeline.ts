import type {
  ExtractedDocument,
  LiveResearchPipeline,
  LiveResearchPipelineResult,
  ResearchFinding,
} from "@/lib/types/live-research";
import type { LocalJsonStore } from "@/lib/types/live-research";
import { createId, nowIso } from "@/lib/utils";
import { mockResearchQueue } from "@/lib/brain/mock-research-queue-store";
import { sourceScheduler } from "../scheduler/source-scheduler";
import { sourceFetcher } from "../fetcher/mock-source-fetcher";
import { documentExtractor } from "../extractor/document-extractor";
import { duplicateDetector } from "../duplicate/duplicate-detector";
import { buildClassifiedContent, contentClassifier } from "../classifier/content-classifier";
import { executiveSummariser } from "../summariser/executive-summariser";
import { researchReviewer } from "../reviewer/research-reviewer";
import { localJsonStore } from "../store/local-json-store";

export class LiveResearchPipelineService implements LiveResearchPipeline {
  constructor(private store: LocalJsonStore = localJsonStore) {}

  async run(asOf: Date = new Date()): Promise<LiveResearchPipelineResult> {
    await this.store.resetRuntimeStore();

    const dueSources = await sourceScheduler.getDueSources(asOf);
    const fetchedDocuments = [];
    const extractedDocuments: ExtractedDocument[] = [];
    let duplicatesRemoved = 0;

    for (const source of dueSources) {
      const fetched = await sourceFetcher.fetch(source.sourceId, source.sourceName);
      fetchedDocuments.push(...fetched);
      await sourceScheduler.markChecked(source.sourceId, asOf);
    }

    const fetchedStore = await this.store.getFetchedContent();
    fetchedStore.documents = fetchedDocuments;
    fetchedStore.lastUpdated = nowIso();
    await this.store.saveFetchedContent(fetchedStore);

    const existingComparable = [
      ...mockResearchQueue.map((item) => ({ title: item.title, url: item.sourceUrl })),
    ];

    for (const document of fetchedDocuments) {
      const extracted = documentExtractor.extract(document);

      if (
        duplicateDetector.isDuplicate(extracted, [
          ...existingComparable,
          ...extractedDocuments.map((item) => ({ title: item.title, url: item.url })),
        ])
      ) {
        duplicatesRemoved += 1;
        continue;
      }

      extractedDocuments.push(extracted);
      existingComparable.push({ title: extracted.title, url: extracted.url });
    }

    const createdFindings: ResearchFinding[] = [];

    for (const document of extractedDocuments) {
      const classification = buildClassifiedContent(
        document,
        document.sourceName,
        contentClassifier,
      );
      const executiveSummary = executiveSummariser.summarise(document, classification);
      const timestamp = nowIso();

      const finding: ResearchFinding = {
        id: createId("finding"),
        sourceId: document.sourceId,
        sourceName: document.sourceName,
        title: document.title,
        url: document.url,
        category: classification.category,
        subcategory: classification.subcategory,
        tags: classification.tags,
        cleanText: document.cleanText,
        executiveSummary,
        status: "pending_review",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const reviewed = await researchReviewer.submitForReview(finding);
      createdFindings.push(reviewed);
    }

    const readyFindings = await researchReviewer.listReadyForApproval();

    return {
      sourcesChecked: dueSources.length,
      itemsFetched: fetchedDocuments.length,
      duplicatesRemoved,
      researchItemsCreated: createdFindings.length,
      itemsReadyForApproval: readyFindings.length,
      sampleSummary: readyFindings[0]?.executiveSummary ?? null,
      findings: readyFindings,
    };
  }
}

export const liveResearchPipeline = new LiveResearchPipelineService();
