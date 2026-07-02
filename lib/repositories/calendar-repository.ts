import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CalendarSyncState,
  ConnectProvider,
  StoredCalendarEvent,
  UpsertCalendarEventInput,
} from "@/lib/types/executive-connect";
import { nowIso } from "@/lib/utils";

export interface CalendarRepository {
  upsertEvents(
    userId: string,
    provider: ConnectProvider,
    events: UpsertCalendarEventInput[],
  ): Promise<number>;
  listToday(userId: string, provider?: ConnectProvider): Promise<StoredCalendarEvent[]>;
  listUpcoming(userId: string, days?: number, provider?: ConnectProvider): Promise<StoredCalendarEvent[]>;
  listByCategory(
    userId: string,
    category: StoredCalendarEvent["category"],
    provider?: ConnectProvider,
  ): Promise<StoredCalendarEvent[]>;
  listDeadlines(userId: string, provider?: ConnectProvider): Promise<StoredCalendarEvent[]>;
  getSyncState(userId: string, provider: ConnectProvider): Promise<CalendarSyncState | null>;
  saveSyncState(
    userId: string,
    provider: ConnectProvider,
    patch: Partial<CalendarSyncState>,
  ): Promise<CalendarSyncState>;
}

function mapEvent(row: Record<string, unknown>): StoredCalendarEvent {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as ConnectProvider,
    externalId: row.external_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    startAt: row.start_at as string,
    endAt: row.end_at as string,
    allDay: Boolean(row.all_day),
    eventType: row.event_type as string,
    category: row.category as StoredCalendarEvent["category"],
    attendees: (row.attendees ?? []) as string[],
    sourceCalendar: (row.source_calendar as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

function startOfUtcDay(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

function endOfUtcDay(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)).toISOString();
}

export class SupabaseCalendarRepository implements CalendarRepository {
  constructor(private client: SupabaseClient) {}

  async upsertEvents(
    userId: string,
    provider: ConnectProvider,
    events: UpsertCalendarEventInput[],
  ): Promise<number> {
    if (events.length === 0) return 0;

    const rows = events.map((event) => ({
      user_id: userId,
      provider,
      external_id: event.externalId,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
      start_at: event.startAt,
      end_at: event.endAt,
      all_day: event.allDay ?? false,
      event_type: event.eventType ?? "event",
      category: event.category,
      attendees: event.attendees ?? [],
      source_calendar: event.sourceCalendar ?? null,
      raw_metadata: event.rawMetadata ?? {},
      updated_at: nowIso(),
    }));

    const { error } = await this.client
      .from("calendar_events")
      .upsert(rows, { onConflict: "user_id,provider,external_id" });
    if (error) throw error;
    return rows.length;
  }

  async listToday(userId: string, provider?: ConnectProvider): Promise<StoredCalendarEvent[]> {
    const today = new Date();
    let query = this.client
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_at", startOfUtcDay(today))
      .lte("start_at", endOfUtcDay(today))
      .order("start_at", { ascending: true });

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }

  async listUpcoming(userId: string, days = 7, provider?: ConnectProvider): Promise<StoredCalendarEvent[]> {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    let query = this.client
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_at", start.toISOString())
      .lte("start_at", end.toISOString())
      .order("start_at", { ascending: true });

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }

  async listByCategory(
    userId: string,
    category: StoredCalendarEvent["category"],
    provider?: ConnectProvider,
  ): Promise<StoredCalendarEvent[]> {
    let query = this.client
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("start_at", { ascending: true });

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }

  async listDeadlines(userId: string, provider?: ConnectProvider): Promise<StoredCalendarEvent[]> {
    const now = new Date().toISOString();
    const horizon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    let query = this.client
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .in("category", ["reminder", "event"])
      .gte("start_at", now)
      .lte("start_at", horizon)
      .order("start_at", { ascending: true });

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  }

  async getSyncState(userId: string, provider: ConnectProvider): Promise<CalendarSyncState | null> {
    const { data, error } = await this.client
      .from("calendar_sync_state")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId,
      provider,
      syncToken: (data.sync_token as string | null) ?? null,
      lastSyncAt: (data.last_sync_at as string | null) ?? null,
      lastSyncStatus: (data.last_sync_status as string | null) ?? null,
      eventsSynced: Number(data.events_synced ?? 0),
      updatedAt: data.updated_at as string,
    };
  }

  async saveSyncState(
    userId: string,
    provider: ConnectProvider,
    patch: Partial<CalendarSyncState>,
  ): Promise<CalendarSyncState> {
    const { data, error } = await this.client
      .from("calendar_sync_state")
      .upsert({
        user_id: userId,
        provider,
        sync_token: patch.syncToken,
        last_sync_at: patch.lastSyncAt ?? nowIso(),
        last_sync_status: patch.lastSyncStatus,
        events_synced: patch.eventsSynced,
        updated_at: nowIso(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return {
      userId,
      provider,
      syncToken: (data.sync_token as string | null) ?? null,
      lastSyncAt: (data.last_sync_at as string | null) ?? null,
      lastSyncStatus: (data.last_sync_status as string | null) ?? null,
      eventsSynced: Number(data.events_synced ?? 0),
      updatedAt: data.updated_at as string,
    };
  }
}
