import type { StoredCalendarEvent } from "@/lib/types/executive-connect";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface TravelCardProps {
  travel: StoredCalendarEvent[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TravelCard({ travel }: TravelCardProps) {
  return (
    <SectionCard title="Travel" subtitle="Flights, trips, and itinerary signals">
      {travel.length === 0 ? (
        <EmptyState>{KITA_EMPTY.travel}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {travel.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDate(item.startAt)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
