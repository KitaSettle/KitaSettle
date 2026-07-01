import type { CalendarEvent, ExecutiveTask } from "@/lib/types/executive";

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "cal-1",
    title: "Aviation CBTA training session",
    startAt: "2026-07-02T09:00:00.000Z",
    endAt: "2026-07-02T12:00:00.000Z",
    category: "Training",
  },
  {
    id: "cal-2",
    title: "Steelworks proposal client review",
    startAt: "2026-07-01T14:00:00.000Z",
    endAt: "2026-07-01T15:00:00.000Z",
    category: "Business",
  },
  {
    id: "cal-3",
    title: "Executive planning block",
    startAt: "2026-07-01T16:00:00.000Z",
    endAt: "2026-07-01T17:00:00.000Z",
    category: "Focus",
  },
];

export const mockExecutiveTasks: ExecutiveTask[] = [
  {
    id: "task-1",
    title: "Review steelworks proposal",
    dueAt: "2026-07-01T17:00:00.000Z",
    status: "in-progress",
    priority: 1,
  },
  {
    id: "task-2",
    title: "Prepare CBTA lesson",
    dueAt: "2026-07-01T20:00:00.000Z",
    status: "pending",
    priority: 2,
  },
  {
    id: "task-3",
    title: "Capture aviation module idea",
    dueAt: "2026-07-02T12:00:00.000Z",
    status: "pending",
    priority: 3,
  },
];
