"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiscoveryInterviewResponse } from "@/lib/types/executive-dna";
import {
  getDiscoveryLoadErrorMessage,
  resolveDiscoverySubmitError,
} from "@/lib/copy/user-errors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { nowIso } from "@/lib/utils";

const MAX_LOAD_ATTEMPTS = 4;
const MAX_SUBMIT_ATTEMPTS = 3;

async function ensureSchemaApplied(): Promise<void> {
  const probe = await fetch("/api/setup/apply-schema");
  const payload = (await probe.json().catch(() => null)) as { ready?: boolean } | null;
  if (payload?.ready) return;
  await fetch("/api/setup/apply-schema", { method: "POST" });
}

async function fetchInterviewWithRetry(): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < MAX_LOAD_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }

    let response = await fetch("/api/executive-dna/interview");
    if (response.status === 503) {
      await fetch("/api/setup/apply-schema", { method: "POST" });
      response = await fetch("/api/executive-dna/interview");
    }

    lastResponse = response;
    if (response.ok) return response;
    if (response.status === 401 || response.status === 403) return response;
  }

  return lastResponse ?? new Response(null, { status: 500 });
}

async function submitAnswerWithRetry(
  answer: string,
): Promise<{ response: Response; payload: DiscoveryInterviewResponse | { error?: string } | null }> {
  let lastResponse: Response | null = null;
  let lastPayload: DiscoveryInterviewResponse | { error?: string } | null = null;

  for (let attempt = 0; attempt < MAX_SUBMIT_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }

    const response = await fetch("/api/executive-dna/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const payload = (await response.json().catch(() => null)) as
      | DiscoveryInterviewResponse
      | { error?: string }
      | null;

    lastResponse = response;
    lastPayload = payload;

    if (response.ok) {
      return { response, payload: payload as DiscoveryInterviewResponse };
    }

    if (response.status === 401 || response.status === 403) {
      break;
    }
  }

  return { response: lastResponse ?? new Response(null, { status: 500 }), payload: lastPayload };
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
  const [reloadToken, setReloadToken] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setData(null);
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await ensureSchemaApplied();
        const response = await fetchInterviewWithRetry();

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
  }, [allowUpdate, router, reloadToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.session.messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer || busy || !data) return;

    setBusy(true);
    setError(null);

    const optimisticMessages = [
      ...data.session.messages,
      { role: "user" as const, content: trimmedAnswer, timestamp: nowIso() },
    ];
    setData({
      ...data,
      session: {
        ...data.session,
        messages: optimisticMessages,
      },
    });

    try {
      const { response, payload } = await submitAnswerWithRetry(trimmedAnswer);

      if (!response.ok || !payload || !("session" in payload)) {
        setData((current) =>
          current
            ? {
                ...current,
                session: {
                  ...current.session,
                  messages: current.session.messages.filter(
                    (message) =>
                      !(
                        message.role === "user" &&
                        message.content === trimmedAnswer &&
                        message.timestamp === optimisticMessages.at(-1)?.timestamp
                      ),
                  ),
                },
              }
            : current,
        );
        throw new Error(
          resolveDiscoverySubmitError(response, payload as { error?: string } | null),
        );
      }

      setData(payload);
      setAnswer("");

      if (payload.isComplete && !allowUpdate) {
        router.replace("/dashboard/executive");
      }
    } catch (submitErr) {
      try {
        const reload = await fetchInterviewWithRetry();
        if (reload.ok) {
          const reloaded = (await reload.json()) as DiscoveryInterviewResponse;
          setData(reloaded);
        }
      } catch {
        // keep optimistic rollback above if reload fails
      }
      setError(
        submitErr instanceof Error
          ? submitErr.message
          : resolveDiscoverySubmitError(new Response(null, { status: 500 }), null),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Unable to continue</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{loadError}</p>
        <Button className="mt-6" onClick={retryLoad}>
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
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">First Conversation</p>
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
