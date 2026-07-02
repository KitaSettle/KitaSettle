import type { Repositories } from "@/lib/repositories";
import { CalendarSyncJob } from "./calendar-sync-job";
import { CalendarService } from "./calendar-service";
import { DocumentService } from "./document-service";
import { EmailService } from "./email-service";

export class SyncScheduler {
  constructor(private repos: Repositories) {}

  async runAll(userId: string): Promise<{ calendar: number; gmail: number; drive: number }> {
    const calendarService = new CalendarService(this.repos);
    const emailService = new EmailService(this.repos);
    const documentService = new DocumentService(this.repos);
    const calendarJob = new CalendarSyncJob(this.repos, calendarService);

    const connection = await this.repos.integrations.getConnection(userId, "google");
    if (!connection || connection.status !== "connected") {
      return { calendar: 0, gmail: 0, drive: 0 };
    }

    const calendarResult = await calendarJob.run(userId);
    const gmail = await emailService.syncFromGoogle(userId);
    await documentService.discoverFolders(userId);
    const drive = await documentService.syncSelectedFolders(userId);

    await this.repos.integrations.updateSyncStatus(userId, "google", "completed");
    return { calendar: calendarResult.synced, gmail, drive };
  }
}
