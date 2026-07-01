import type {
  ClassifiedContent,
  ContentCategory,
  ContentClassifier,
  ExtractedDocument,
} from "@/lib/types/live-research";
import { nowIso } from "@/lib/utils";

const CATEGORY_RULES: Array<{
  category: ContentCategory;
  keywords: string[];
  subcategory: string;
}> = [
  { category: "Aviation", keywords: ["rvsm", "cbta", "icao", "caam", "faa", "easa", "iata", "boeing", "airbus", "aviation", "training"], subcategory: "Operations" },
  { category: "Regulations", keywords: ["circular", "regulation", "compliance", "guidance", "advisory"], subcategory: "Compliance" },
  { category: "Engineering", keywords: ["structural", "maintenance", "engineering", "construction", "cidb", "steelworks"], subcategory: "Projects" },
  { category: "Finance", keywords: ["pricing", "margin", "finance", "investment", "cost"], subcategory: "Analysis" },
  { category: "AI", keywords: ["ai", "openai", "model", "governance", "machine learning"], subcategory: "Technology" },
  { category: "Leadership", keywords: ["executive", "decision", "founder", "leadership", "hbr"], subcategory: "Strategy" },
  { category: "Opportunities", keywords: ["workforce", "partnership", "market", "growth", "opportunity"], subcategory: "Growth" },
  { category: "Business", keywords: ["proposal", "client", "business", "operator"], subcategory: "Operations" },
];

function detectCategory(text: string, sourceName: string): {
  category: ContentCategory;
  subcategory: string;
  tags: string[];
} {
  const haystack = `${text} ${sourceName}`.toLowerCase();
  const source = sourceName.toLowerCase();

  if (source.includes("openai") || source.includes("google ai") || source.includes("microsoft learn")) {
    return { category: "AI", subcategory: "Technology", tags: ["ai", "governance"] };
  }

  if (source.includes("harvard business review") || source.includes("mckinsey")) {
    return { category: "Leadership", subcategory: "Strategy", tags: ["leadership", "strategy"] };
  }

  if (source.includes("cidb")) {
    return { category: "Engineering", subcategory: "Projects", tags: ["engineering", "proposal"] };
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        tags: rule.keywords.filter((keyword) => haystack.includes(keyword)).slice(0, 4),
      };
    }
  }

  return {
    category: "Business",
    subcategory: "General",
    tags: ["research"],
  };
}

export class MockContentClassifier implements ContentClassifier {
  classify(
    document: ExtractedDocument,
    sourceName: string,
  ): Omit<ClassifiedContent, "extractedDocumentId" | "classifiedAt"> {
    const detected = detectCategory(`${document.title} ${document.cleanText}`, sourceName);

    return {
      category: detected.category,
      subcategory: detected.subcategory,
      tags: detected.tags,
    };
  }
}

export function buildClassifiedContent(
  document: ExtractedDocument,
  sourceName: string,
  classifier: ContentClassifier = new MockContentClassifier(),
): ClassifiedContent {
  const result = classifier.classify(document, sourceName);
  return {
    extractedDocumentId: document.fetchedDocumentId,
    ...result,
    classifiedAt: nowIso(),
  };
}

export const contentClassifier = new MockContentClassifier();
