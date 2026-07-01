import type { DuplicateDetector, ExtractedDocument } from "@/lib/types/live-research";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeTitle(text)
      .split(" ")
      .filter((token) => token.length > 2),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export class MockDuplicateDetector implements DuplicateDetector {
  private readonly titleThreshold = 0.82;

  isDuplicate(
    candidate: Pick<ExtractedDocument, "title" | "url" | "cleanText">,
    existing: Array<Pick<ExtractedDocument, "title" | "url"> & { id?: string }>,
  ): boolean {
    const candidateTokens = tokenSet(candidate.title);

    return existing.some((item) => {
      if (item.url === candidate.url) return true;

      const existingTokens = tokenSet(item.title);
      const similarity = jaccardSimilarity(candidateTokens, existingTokens);
      return similarity >= this.titleThreshold;
    });
  }
}

export const duplicateDetector = new MockDuplicateDetector();
