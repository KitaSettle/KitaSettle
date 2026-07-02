import type { DocumentIndexEntry } from "@/lib/types/executive-connect";
import { SectionCard } from "@/components/dashboard/SectionCard";

interface DocumentsReviewCardProps {
  documents: DocumentIndexEntry[];
}

export function DocumentsReviewCard({ documents }: DocumentsReviewCardProps) {
  return (
    <SectionCard title="Documents Requiring Review" subtitle="Indexed from connected Drive folders">
      {documents.length === 0 ? (
        <p className="text-sm text-muted">No documents flagged for review.</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-sm font-medium text-foreground">{doc.name}</p>
              {doc.summary && <p className="mt-1 text-sm text-muted">{doc.summary}</p>}
              {doc.webViewLink && (
                <a
                  href={doc.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-accent hover:underline"
                >
                  Open in Drive
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
