import type { SourceScheduler, SourceScheduleEntry } from "@/lib/types/live-research";
import type { EntityId } from "@/lib/types/common";
import type { LocalJsonStore } from "@/lib/types/live-research";
import { localJsonStore } from "../store/local-json-store";

const DAY_MS = 24 * 60 * 60 * 1000;

function frequencyToMs(frequency: SourceScheduleEntry["frequency"]): number {
  switch (frequency) {
    case "daily":
      return DAY_MS;
    case "weekly":
      return 7 * DAY_MS;
    case "monthly":
      return 30 * DAY_MS;
  }
}

function isDue(entry: SourceScheduleEntry, asOf: Date): boolean {
  if (!entry.enabled) return false;
  if (!entry.lastCheckedAt) return true;

  const lastChecked = new Date(entry.lastCheckedAt).getTime();
  return asOf.getTime() - lastChecked >= frequencyToMs(entry.frequency);
}

export class MockSourceScheduler implements SourceScheduler {
  constructor(private store: LocalJsonStore = localJsonStore) {}

  async getSchedules(): Promise<SourceScheduleEntry[]> {
    return this.store.getSchedules();
  }

  async getDueSources(asOf: Date = new Date()): Promise<SourceScheduleEntry[]> {
    const schedules = await this.getSchedules();
    return schedules.filter((entry) => isDue(entry, asOf));
  }

  async markChecked(sourceId: EntityId, checkedAt: Date = new Date()): Promise<void> {
    const schedules = await this.getSchedules();
    const updated = schedules.map((entry) =>
      entry.sourceId === sourceId
        ? { ...entry, lastCheckedAt: checkedAt.toISOString() }
        : entry,
    );
    await this.store.saveSchedules(updated);
  }
}

export const sourceScheduler = new MockSourceScheduler();
