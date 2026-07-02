"use client";

import { useEffect, useState } from "react";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { ExecutiveDailyContent } from "./ExecutiveDailyContent";
import { ExecutiveDailySkeleton } from "./ExecutiveDailySkeleton";

export function ExecutiveDailyLoader() {
  const [name, setName] = useState("Executive");
  const [data, setData] = useState<DailyExecutiveBriefPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [userResponse, briefResponse] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/dashboard/executive"),
        ]);

        if (!userResponse.ok || !briefResponse.ok) {
          const errorBody = (await briefResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(errorBody?.error ?? "Failed to load daily executive brief");
        }

        const user = (await userResponse.json()) as { name: string };
        const briefData = (await briefResponse.json()) as DailyExecutiveBriefPayload;

        if (!cancelled) {
          setName(user.name || "Executive");
          setData(briefData);
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
    throw new Error(error);
  }

  if (!data) {
    return <ExecutiveDailySkeleton />;
  }

  return <ExecutiveDailyContent name={name} data={data} />;
}
