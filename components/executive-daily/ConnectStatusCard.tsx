"use client";

import { useState } from "react";
import type { IntegrationStatusSummary } from "@/lib/types/executive-connect";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/Button";

interface ConnectStatusCardProps {
  integrations: IntegrationStatusSummary[];
  googleConfigured: boolean;
}

export function ConnectStatusCard({ integrations, googleConfigured }: ConnectStatusCardProps) {
  const google = integrations.find((item) => item.provider === "google");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSync() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/sync", { method: "POST" });
      setMessage(
        response.ok
          ? "Google sync started. Your brief will refresh shortly."
          : "We couldn't sync Google right now. Please try again.",
      );
    } catch {
      setMessage("We couldn't sync Google right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      setMessage(
        response.ok
          ? "Google disconnected."
          : "We couldn't disconnect Google. Please try again.",
      );
      if (response.ok) {
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setMessage("We couldn't disconnect Google. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Executive Connect"
      subtitle="Connect your real-world tools to enrich your daily brief"
    >
      <div className="space-y-4">
        {message && (
          <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-foreground" role="status">
            {message}
          </p>
        )}

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
                  <Button variant="ghost" disabled={busy} onClick={() => void handleSync()}>
                    Sync now
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => void handleDisconnect()}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  disabled={busy || !googleConfigured}
                  onClick={() => {
                    window.location.href = "/api/integrations/google/connect";
                  }}
                >
                  Connect Google
                </Button>
              )}
            </div>
          </div>
          {!googleConfigured && (
            <p className="mt-3 text-xs text-muted">
              Google connection is not available in this environment yet. Your brief still works
              with what you share directly with Kita.
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
