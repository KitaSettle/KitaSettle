"use client";

import type { IntegrationStatusSummary } from "@/lib/types/executive-connect";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/Button";

interface ConnectStatusCardProps {
  integrations: IntegrationStatusSummary[];
  googleConfigured: boolean;
}

export function ConnectStatusCard({ integrations, googleConfigured }: ConnectStatusCardProps) {
  const google = integrations.find((item) => item.provider === "google");

  return (
    <SectionCard
      title="Executive Connect"
      subtitle="Connect your real-world tools to enrich your daily brief"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Google Workspace</p>
              <p className="mt-1 text-sm text-muted">
                Calendar, Gmail, and Drive metadata sync
              </p>
              {google?.connected && google.accountEmail && (
                <p className="mt-1 text-xs text-muted">{google.accountEmail}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {google?.connected ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => void fetch("/api/integrations/sync", { method: "POST" })}
                  >
                    Sync now
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void fetch("/api/integrations/google/disconnect", { method: "POST" })}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={() => { window.location.href = "/api/integrations/google/connect"; }}>
                  Connect Google
                </Button>
              )}
            </div>
          </div>
          {!googleConfigured && (
            <p className="mt-3 text-xs text-muted">
              Live Google OAuth requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Mock mode uses seeded executive data.
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {integrations
            .filter((item) => item.provider !== "google")
            .slice(0, 4)
            .map((item) => (
              <div
                key={item.provider}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted"
              >
                {item.label} — coming soon
              </div>
            ))}
        </div>
      </div>
    </SectionCard>
  );
}
