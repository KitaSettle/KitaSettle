"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiscoveryInterviewResponse } from "@/lib/types/executive-dna";
import {
  getDiscoveryLoadErrorMessage,
  getDiscoverySubmitErrorMessage,
} from "@/lib/copy/user-errors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";

async function ensureSchemaApplied(): Promise<void> {
  const probe = await fetch("/api/setup/apply-schema");
  const payload = (await probe.json().catch(() => null)) as { ready?: boolean } | null;
  if (payload?.ready) return;
  await fetch("/api/setup/apply-schema", { method: "POST" });
}

function DiscoveryInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allowUpdate = searchParams.get("update") === "1";
  const [data, setData] = useState<DiscoveryInterviewResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await ensureSchemaApplied();

        let response = await fetch("/api/executive-dna/interview");
        if (response.status === 503) {
          await fetch("/api/setup/apply-schema", { method: "POST" });
          response = await fetch("/api/executive-dna/interview");
        }
        if (!response.ok) {
          throw new Error(getDiscoveryLoadErrorMessage());
        }
        const payload = (await response.json()) as DiscoveryInterviewResponse;
        if (!cancelled) {
          setData(payload);
          if (payload.isComplete && !allowUpdate) {
            router.replace("/dashboard/executive");
          }
        }
      } catch (loadErr) {
        if (!cancelled) {
          setLoadError(
            loadErr instanceof Error ? loadErr.message : getDiscoveryLoadErrorMessage(),
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [allowUpdate, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.session.messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim() || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/executive-dna/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) {
        throw new Error(getDiscoverySubmitErrorMessage());
      }

      const payload = (await response.json()) as DiscoveryInterviewResponse;
      setData(payload);
      setAnswer("");

      if (payload.isComplete && !allowUpdate) {
        router.replace("/dashboard/executive");
      }
    } catch {
      setError(getDiscoverySubmitErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Unable to continue</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{loadError}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) {
    return <KitaWorking context="discovery" />;
  }

  return (
    <div className="mx-auto max-w-3xl kita-enter">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Getting to know you</p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          {allowUpdate ? "Update how Kita knows you" : "Help Kita understand how you work"}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          A short conversation — no forms, no checklists. Kita learns from how you answer and
          keeps refining as you use your brief each day.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge variant="default">Understanding you: {data.overallConfidence}%</Badge>
          <Badge variant="muted">Goal: deeply personal briefs</Badge>
        </div>
        {allowUpdate && data.isComplete && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              Your profile is complete. Share more with Give to Kita anytime, or revisit this
              conversation below.
            </p>
            <Button variant="secondary" onClick={() => router.push("/dashboard/executive")}>
              Back to Today
            </Button>
          </div>
        )}
      </div>

      <Card className="mb-8 max-h-[28rem] overflow-y-auto" padding="relaxed">
        <div className="space-y-4">
          {data.session.messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                message.role === "assistant"
                  ? "bg-accent-soft text-foreground"
                  : "ml-6 border border-border/80 bg-background text-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      {!data.isComplete && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={4}
            placeholder="Share your answer in your own words..."
            className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {error && (
            <p className="text-sm text-warning" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !answer.trim()} className="h-11 px-6">
            {busy ? "Kita is listening..." : "Continue"}
          </Button>
        </form>
      )}
    </div>
  );
}

export function DiscoveryInterviewLoader() {
  return (
    <Suspense fallback={<KitaWorking context="discovery" />}>
      <DiscoveryInterviewContent />
    </Suspense>
  );
}
