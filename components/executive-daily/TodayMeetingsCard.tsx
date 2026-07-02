import type { StoredCalendarEvent } from "@/lib/types/executive-connect";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface TodayMeetingsCardProps {
  meetings: StoredCalendarEvent[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function TodayMeetingsCard({ meetings }: TodayMeetingsCardProps) {
  const items = meetings.filter((item) => item.category === "meeting" || item.category === "event");

  return (
    <SectionCard title="Today's Meetings" subtitle="From your connected calendar">
      {items.length === 0 ? (
        <EmptyState>{KITA_EMPTY.meetings}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatTime(item.startAt)} – {formatTime(item.endAt)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
