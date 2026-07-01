import type {
  DocumentExtractor,
  ExtractedDocument,
  FetchedDocument,
} from "@/lib/types/live-research";
import { nowIso } from "@/lib/utils";

const NOISE_PATTERNS = [
  /^home\s*[|·]\s*/i,
  /^navigation\s*[|·]\s*/i,
  /^footer\s*[|·]\s*/i,
  /subscribe\s*[|·]\s*sign in/i,
  /privacy policy/i,
  /cookie policy/i,
  /terms of use/i,
  /site map/i,
  /copyright/i,
  /government of malaysia/i,
  /harvard business publishing/i,
];

function stripNoiseLines(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !NOISE_PATTERNS.some((pattern) => pattern.test(line)))
    .join("\n\n");
}

export class MockDocumentExtractor implements DocumentExtractor {
  extract(document: FetchedDocument): ExtractedDocument {
    const withoutHtml = document.rawText.replace(/<[^>]+>/g, " ");
    const cleanText = stripNoiseLines(withoutHtml).replace(/\s{2,}/g, " ").trim();

    return {
      fetchedDocumentId: document.id,
      sourceId: document.sourceId,
      sourceName: document.sourceName,
      title: document.title,
      url: document.url,
      cleanText,
      extractedAt: nowIso(),
    };
  }
}

export const documentExtractor = new MockDocumentExtractor();
