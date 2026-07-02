"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { getExecutiveLoadErrorMessage } from "@/lib/copy/user-errors";
import { Button } from "@/components/ui/Button";
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

        if (userResponse.status === 401) {
          router.replace("/login?next=/dashboard/executive");
          return;
        }

        if (!userResponse.ok) {
          throw new Error(getExecutiveLoadErrorMessage("user profile"));
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
        if (briefResponse.status === 401) {
          router.replace("/login?next=/dashboard/executive");
          return;
        }

        if (!briefResponse.ok) {
          const errorBody = (await briefResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(getExecutiveLoadErrorMessage(errorBody?.error));
        }

        const briefData = (await briefResponse.json()) as DailyExecutiveBriefPayload;

        if (!cancelled) {
          setName(user.name || "Executive");
          setData(briefData);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : getExecutiveLoadErrorMessage(undefined),
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Unable to load today&apos;s brief</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{error}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) {
    return <ExecutiveDailySkeleton />;
  }

  return (
    <Suspense fallback={<ExecutiveDailySkeleton />}>
      <ExecutiveDailyContent name={name} data={data} />
    </Suspense>
  );
}
