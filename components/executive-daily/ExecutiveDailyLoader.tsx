"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { ExecutiveDailyContent } from "./ExecutiveDailyContent";
import { ExecutiveDailySkeleton } from "./ExecutiveDailySkeleton";

export function ExecutiveDailyLoader() {
  const router = useRouter();
  const [name, setName] = useState("Executive");
  const [data, setData] = useState<DailyExecutiveBriefPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [userResponse, statusResponse] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/executive-dna/status"),
        ]);

        if (!userResponse.ok) {
          throw new Error("Failed to load user profile");
        }

        const user = (await userResponse.json()) as { name: string };

        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as { needsDiscovery?: boolean };
          if (status.needsDiscovery) {
            router.replace("/dashboard/discovery");
            return;
          }
        }

        const briefResponse = await fetch("/api/dashboard/executive");
        if (!briefResponse.ok) {
          const errorBody = (await briefResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(errorBody?.error ?? "Failed to load daily executive brief");
        }

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
  }, [router]);

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    return <ExecutiveDailySkeleton />;
  }

  return <ExecutiveDailyContent name={name} data={data} />;
}
