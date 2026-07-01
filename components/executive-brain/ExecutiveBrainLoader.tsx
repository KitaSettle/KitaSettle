"use client";

import { useEffect, useState } from "react";
import type { ExecutiveBrainData } from "@/lib/types";
import { ExecutiveBrainContent } from "./ExecutiveBrainContent";

export function ExecutiveBrainLoader() {
  const [data, setData] = useState<ExecutiveBrainData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/executive-brain");
        if (!response.ok) {
          throw new Error("Failed to load Executive Brain");
        }
        const payload = (await response.json()) as ExecutiveBrainData;
        if (!cancelled) setData(payload);
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

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
      </div>
    );
  }

  return <ExecutiveBrainContent data={data} />;
}
