"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DiscoveryInterviewResponse } from "@/lib/types/executive-dna";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function DiscoveryInterviewLoader() {
  const router = useRouter();
  const [data, setData] = useState<DiscoveryInterviewResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/executive-dna/interview");
        if (!response.ok) {
          throw new Error("Failed to start discovery interview");
        }
        const payload = (await response.json()) as DiscoveryInterviewResponse;
        if (!cancelled) {
          setData(payload);
          if (payload.isComplete) {
            router.replace("/dashboard/executive");
          }
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.session.messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/executive-dna/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) {
        throw new Error("Failed to send answer");
      }

      const payload = (await response.json()) as DiscoveryInterviewResponse;
      setData(payload);
      setAnswer("");

      if (payload.isComplete) {
        router.replace("/dashboard/executive");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send answer");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Executive DNA Discovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Help KitaSettle learn how you work
        </h1>
        <p className="mt-2 text-muted">
          A short conversational interview replaces traditional onboarding. KitaSettle keeps
          learning as you approve research, save knowledge, and use your daily brief.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="default">Profile confidence {data.overallConfidence}%</Badge>
          <Badge variant="default">Target 90%</Badge>
        </div>
      </div>

      <Card className="mb-6 max-h-[28rem] overflow-y-auto">
        <div className="space-y-4">
          {data.session.messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`rounded-xl px-4 py-3 text-sm ${
                message.role === "assistant"
                  ? "bg-accent/10 text-foreground"
                  : "ml-8 bg-background text-foreground"
              }`}
            >
              {message.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      {!data.isComplete && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={4}
            placeholder="Share your answer..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <Button type="submit" disabled={loading || !answer.trim()}>
            {loading ? "Sending..." : "Continue"}
          </Button>
        </form>
      )}
    </div>
  );
}
