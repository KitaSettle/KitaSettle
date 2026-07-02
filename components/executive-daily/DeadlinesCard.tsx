import type { StoredCalendarEvent } from "@/lib/types/executive-connect";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface DeadlinesCardProps {
  deadlines: StoredCalendarEvent[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeadlinesCard({ deadlines }: DeadlinesCardProps) {
  return (
    <SectionCard title="Deadlines" subtitle="Upcoming reminders and due dates">
      {deadlines.length === 0 ? (
        <EmptyState>{KITA_EMPTY.deadlines}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {deadlines.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(item.startAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
