"use client";

import { useEffect, useState } from "react";
import type { ExecutiveBrief, QuickAction } from "@/lib/types";
import { DashboardContent } from "./DashboardContent";

const quickActions: QuickAction[] = [
  { id: "qa1", label: "Review proposal" },
  { id: "qa2", label: "Approve direction" },
  { id: "qa3", label: "Open Executive Brain" },
];

export function DashboardLoader() {
  const [name, setName] = useState("Executive");
  const [brief, setBrief] = useState<ExecutiveBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [userResponse, briefResponse] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/executive-briefs"),
        ]);

        if (!userResponse.ok || !briefResponse.ok) {
          throw new Error("Failed to load dashboard");
        }

        const user = (await userResponse.json()) as { name: string };
        const briefData = (await briefResponse.json()) as ExecutiveBrief;

        if (!cancelled) {
          setName(user.name || "Executive");
          setBrief(briefData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
        {error}
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
      </div>
    );
  }

  return (
    <DashboardContent name={name} brief={brief} quickActions={quickActions} />
  );
}
