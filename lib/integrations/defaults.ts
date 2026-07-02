import type { ExecutiveConnectSnapshot } from "@/lib/types/executive-connect";

export const EMPTY_CONNECT_SNAPSHOT: ExecutiveConnectSnapshot = {
  integrations: [],
  todayMeetings: [],
  importantEmails: [],
  deadlines: [],
  travel: [],
  documentsToReview: [],
  googleConfigured: false,
};

export function isMissingConnectTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string" ? error.message : String(error);
  return /integration_connections|calendar_events|email_metadata|document_index|relation .* does not exist|schema cache/i.test(
    message,
  );
}

export async function withConnectFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingConnectTableError(error)) return fallback;
    throw error;
  }
}
