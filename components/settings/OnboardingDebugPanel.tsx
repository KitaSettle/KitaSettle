"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface OnboardingDebugPayload {
  authenticated?: boolean;
  userId?: string;
  email?: string | null;
  hasPublicUsersRow?: boolean;
  hasDnaProfile?: boolean;
  bootstrapAttempted?: boolean;
  bootstrapResult?: {
    ok?: boolean;
    method?: string;
    error?: string;
    failedStep?: string;
  } | null;
  schema?: {
    ready?: boolean;
    missingTables?: string[];
    hint?: string;
  };
  hasDatabaseUrl?: boolean;
  error?: string;
}

export function OnboardingDebugPanel() {
  const [data, setData] = useState<OnboardingDebugPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/debug/onboarding");
    const payload = (await response.json()) as OnboardingDebugPayload;
    setData(payload);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function applySchema() {
    setBusy(true);
    setApplyMessage(null);
    try {
      const response = await fetch("/api/setup/apply-schema", { method: "POST" });
      const payload = (await response.json()) as { status?: string; error?: string };
      setApplyMessage(payload.error ?? payload.status ?? "Done");
      await refresh();
    } catch (error) {
      setApplyMessage(error instanceof Error ? error.message : "Schema apply failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="relaxed" className="border-warning/30 bg-warning/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Founder onboarding debug</h2>
          <p className="mt-2 text-sm text-muted">
            Temporary diagnostics for new-user bootstrap and schema readiness.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
          <Button disabled={busy} onClick={() => void applySchema()}>
            {busy ? "Applying..." : "Apply schema"}
          </Button>
        </div>
      </div>

      {applyMessage && (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-foreground">{applyMessage}</p>
      )}

      <pre className="mt-4 overflow-x-auto rounded-xl bg-surface p-4 text-xs text-foreground">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}
