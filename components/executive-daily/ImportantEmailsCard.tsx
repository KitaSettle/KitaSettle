import type { StoredEmailMetadata } from "@/lib/types/executive-connect";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/ui/Badge";

interface ImportantEmailsCardProps {
  emails: StoredEmailMetadata[];
}

export function ImportantEmailsCard({ emails }: ImportantEmailsCardProps) {
  return (
    <SectionCard title="Important Emails" subtitle="What needs your attention in your inbox">
      {emails.length === 0 ? (
        <EmptyState>{KITA_EMPTY.emails}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {emails.map((email) => (
            <li key={email.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{email.subject}</p>
                <Badge variant="default">{email.classification}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{email.sender}</p>
              {email.snippet && <p className="mt-2 text-sm text-muted">{email.snippet}</p>}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
