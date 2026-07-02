import type {
  ClassifiedContent,
  ExecutiveSummariser,
  ExecutiveSummary,
  ExtractedDocument,
} from "@/lib/types/live-research";
import type { Importance } from "@/lib/types/common";
import { isOpenAIConfigured } from "@/lib/config/env";
import { summarizeResearchDocument } from "@/lib/ai/research-summary";

function scoreConfidence(document: ExtractedDocument, classification: ClassifiedContent): number {
  let score = 72;
  if (document.cleanText.length > 120) score += 8;
  if (classification.tags.length >= 2) score += 6;
  if (["Regulations", "Aviation"].includes(classification.category)) score += 7;
  return Math.min(score, 96);
}

function scoreImportance(classification: ClassifiedContent): Importance {
  if (["Regulations", "Aviation", "Finance"].includes(classification.category)) {
    return "High";
  }
  if (classification.category === "Leadership") return "Medium";
  return "Medium";
}

export class MockExecutiveSummariser implements ExecutiveSummariser {
  async summarise(
    document: ExtractedDocument,
    classification: ClassifiedContent,
  ): Promise<ExecutiveSummary> {
    const importance = scoreImportance(classification);
    const confidence = scoreConfidence(document, classification);

    const summary = `${document.sourceName} published "${document.title}" in the ${classification.category} space. ${document.cleanText.slice(0, 220)}${document.cleanText.length > 220 ? "..." : ""}`;

    const whyItMatters = `This ${classification.category.toLowerCase()} update may affect your current priorities around training, proposals, and executive decision-making this week.`;

    const recommendedAction =
      importance === "High"
        ? "Review today and decide whether to approve this finding into Executive Brain knowledge."
        : "Save to memory or monitor during your next planning block.";

    return {
      summary,
      whyItMatters,
      recommendedAction,
      confidence,
      importance,
    };
  }
}

export class OpenAIExecutiveSummariser implements ExecutiveSummariser {
  async summarise(
    document: ExtractedDocument,
    classification: ClassifiedContent,
  ): Promise<ExecutiveSummary> {
    return summarizeResearchDocument({
      title: document.title,
      sourceName: document.sourceName,
      category: classification.category,
      subcategory: classification.subcategory,
      tags: classification.tags,
      cleanText: document.cleanText,
    });
  }
}

export function createExecutiveSummariser(): ExecutiveSummariser {
  return isOpenAIConfigured()
    ? new OpenAIExecutiveSummariser()
    : new MockExecutiveSummariser();
}

export const executiveSummariser = createExecutiveSummariser();
