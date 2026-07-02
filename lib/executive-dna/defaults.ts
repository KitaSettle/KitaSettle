import type {
  ExecutiveDNARecommendation,
  ExecutiveDNAStatus,
  ExecutivePersonalizationHints,
} from "@/lib/types/executive-dna";
import { DEFAULT_PERSONALIZATION } from "./field-definitions";

export const DEFAULT_EXECUTIVE_DNA_STATUS: ExecutiveDNAStatus = {
  overallConfidence: 0,
  interviewComplete: false,
  needsDiscovery: true,
  version: 1,
};

export const DEFAULT_EXECUTIVE_DNA_PERSONALIZATION: ExecutivePersonalizationHints =
  DEFAULT_PERSONALIZATION;

export function isMissingExecutiveDnaTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string" ? error.message : String(error);
  return /executive_dna|relation .* does not exist|schema cache/i.test(message);
}

export async function withExecutiveDnaFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingExecutiveDnaTableError(error)) {
      return fallback;
    }
    throw error;
  }
}

export function emptyRecommendations(): ExecutiveDNARecommendation[] {
  return [];
}
