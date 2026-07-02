import type { Repositories } from "@/lib/repositories";
import type { ExecutiveConnectSnapshot } from "@/lib/types/executive-connect";
import { isGoogleOAuthConfigured } from "./google-oauth";
import { createIntegrationManager } from "./integration-manager";

export async function buildExecutiveConnectSnapshot(
  userId: string,
  repos: Repositories,
): Promise<ExecutiveConnectSnapshot> {
  const manager = createIntegrationManager(repos);
  const [integrations, todayMeetings, importantEmails, deadlines, travel, documentsToReview] =
    await Promise.all([
      manager.listStatus(userId),
      repos.calendar.listToday(userId, "google"),
      repos.email.listImportant(userId, 8, "google"),
      repos.calendar.listDeadlines(userId, "google"),
      repos.calendar.listByCategory(userId, "travel", "google"),
      repos.documents.listRequiringReview(userId, 8, "google"),
    ]);

  return {
    integrations,
    todayMeetings,
    importantEmails,
    deadlines,
    travel,
    documentsToReview,
    googleConfigured: isGoogleOAuthConfigured(),
  };
}
