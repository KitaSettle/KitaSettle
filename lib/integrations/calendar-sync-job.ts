import type { Repositories } from "@/lib/repositories";
import { CalendarService } from "./calendar-service";

export class CalendarSyncJob {
  constructor(
    private repos: Repositories,
    private calendarService: CalendarService,
  ) {}

  async run(userId: string): Promise<{ synced: number }> {
    const job = await this.repos.integrations.createSyncJob(userId, "google", "calendar");

    try {
      const connection = await this.repos.integrations.getConnection(userId, "google");
      if (!connection || connection.status !== "connected") {
        await this.repos.integrations.completeSyncJob(job.id, "completed");
        return { synced: 0 };
      }

      const synced = await this.calendarService.syncFromGoogle(userId);
      await this.repos.integrations.updateSyncStatus(userId, "google", "completed");
      await this.repos.integrations.completeSyncJob(job.id, "completed");
      return { synced };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Calendar sync failed";
      await this.repos.integrations.updateSyncStatus(userId, "google", "failed", message);
      await this.repos.integrations.completeSyncJob(job.id, "failed", message);
      throw error;
    }
  }
}
