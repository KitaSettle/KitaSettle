"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyExecutiveBriefPayload } from "@/lib/types/daily-executive-brief";
import { getExecutiveLoadErrorMessage } from "@/lib/copy/user-errors";
import { Button } from "@/components/ui/Button";
import { ExecutiveDailyContent } from "./ExecutiveDailyContent";
import { ExecutiveDailySkeleton } from "./ExecutiveDailySkeleton";

async function ensureSchemaApplied(): Promise<void> {
  const probe = await fetch("/api/setup/apply-schema");
  const payload = (await probe.json().catch(() => null)) as { ready?: boolean } | null;
  if (payload?.ready) return;
  await fetch("/api/setup/apply-schema", { method: "POST" });
}

export function ExecutiveDailyLoader() {
  const router = useRouter();
  const [name, setName] = useState("Executive");
  const [data, setData] = useState<DailyExecutiveBriefPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await ensureSchemaApplied();

        let userResponse = await fetch("/api/users/me");
        let statusResponse = await fetch("/api/executive-dna/status");

        if (userResponse.status === 401 || statusResponse.status === 401) {
          router.replace("/login?next=/dashboard/discovery");
          return;
        }

        if (userResponse.status === 503 || statusResponse.status === 503) {
          await fetch("/api/setup/apply-schema", { method: "POST" });
          userResponse = await fetch("/api/users/me");
          statusResponse = await fetch("/api/executive-dna/status");
        }

        if (!userResponse.ok) {
          if (!cancelled) {
            setError(getExecutiveLoadErrorMessage(undefined));
          }
          return;
        }

        const user = (await userResponse.json()) as { name: string };

        let needsDiscovery = true;
        if (statusResponse.ok) {
          const status = (await statusResponse.json()) as { needsDiscovery?: boolean };
          needsDiscovery = status.needsDiscovery !== false;
        }

        if (needsDiscovery) {
          router.replace("/dashboard/discovery");
          return;
        }

        const briefResponse = await fetch("/api/dashboard/executive");
        if (briefResponse.status === 401) {
          router.replace("/login?next=/dashboard/executive");
          return;
        }

        if (!briefResponse.ok) {
          if (!cancelled) {
            setError(getExecutiveLoadErrorMessage(undefined));
          }
          return;
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
        <h2 className="text-xl font-semibold text-foreground">Setting up your account</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{error}</p>
        <Button className="mt-6" onClick={() => router.replace("/dashboard/discovery")}>
          Continue to First Conversation
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
