import type { Repositories } from "@/lib/repositories";
import type { UpsertCalendarEventInput } from "@/lib/types/executive-connect";
import {
  fetchGoogleCalendarEvents,
  isGoogleOAuthConfigured,
  refreshGoogleAccessToken,
} from "./google-oauth";
import { inferCalendarCategory } from "./classifiers";
import { nowIso } from "@/lib/utils";

export class CalendarService {
  constructor(private repos: Repositories) {}

  async listToday(userId: string) {
    return this.repos.calendar.listToday(userId, "google");
  }

  async listTravel(userId: string) {
    return this.repos.calendar.listByCategory(userId, "travel", "google");
  }

  async listDeadlines(userId: string) {
    return this.repos.calendar.listDeadlines(userId, "google");
  }

  private async getAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.repos.integrations.getTokens(userId, "google");
    if (!tokens?.accessToken) return null;

    if (tokens.tokenExpiresAt && new Date(tokens.tokenExpiresAt).getTime() > Date.now() + 60_000) {
      return tokens.accessToken;
    }

    if (!tokens.refreshToken || !isGoogleOAuthConfigured()) {
      return tokens.accessToken;
    }

    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await this.repos.integrations.saveTokens(userId, "google", {
      accessToken: refreshed.access_token,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: expiresAt,
      scopes: tokens.scopes,
      accountEmail: tokens.accountEmail,
    });
    return refreshed.access_token;
  }

  private mapGoogleEvents(items: NonNullable<Awaited<ReturnType<typeof fetchGoogleCalendarEvents>>["items"]>): UpsertCalendarEventInput[] {
    return items
      .filter((item) => item.id && item.start)
      .map((item) => {
        const allDay = Boolean(item.start?.date && !item.start?.dateTime);
        const startAt = item.start?.dateTime ?? `${item.start?.date}T00:00:00.000Z`;
        const endAt = item.end?.dateTime ?? `${item.end?.date ?? item.start?.date}T23:59:59.999Z`;
        const title = item.summary ?? "Untitled event";
        return {
          externalId: item.id,
          title,
          description: item.description ?? null,
          location: item.location ?? null,
          startAt,
          endAt,
          allDay,
          eventType: item.eventType ?? "event",
          category: inferCalendarCategory({
            title,
            description: item.description,
            location: item.location,
            eventType: item.eventType,
          }),
          attendees: (item.attendees ?? []).map((attendee) => attendee.email).filter(Boolean) as string[],
          sourceCalendar: "primary",
          rawMetadata: item as Record<string, unknown>,
        };
      });
  }

  async syncFromGoogle(userId: string): Promise<number> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return 0;

    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const response = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);
    const events = this.mapGoogleEvents(response.items ?? []);
    const count = await this.repos.calendar.upsertEvents(userId, "google", events);

    await this.repos.calendar.saveSyncState(userId, "google", {
      syncToken: response.nextSyncToken ?? null,
      lastSyncAt: nowIso(),
      lastSyncStatus: "completed",
      eventsSynced: count,
    });

    return count;
  }
}
