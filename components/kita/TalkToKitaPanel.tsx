"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { KitaChatMessage } from "@/lib/repositories/kita-chat-repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { GiveToKita } from "@/components/intake/GiveToKita";

interface TalkPayload {
  messages: KitaChatMessage[];
  curiosityQuestion: string | null;
}

const MAX_SUBMIT_ATTEMPTS = 3;

async function submitMessageWithRetry(message: string): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < MAX_SUBMIT_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    lastResponse = await fetch("/api/kita/talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (lastResponse.ok) return lastResponse;
    if (lastResponse.status === 401 || lastResponse.status === 403) break;
  }
  return lastResponse ?? new Response(null, { status: 500 });
}

export function TalkToKitaPanel() {
  const [data, setData] = useState<TalkPayload | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/kita/talk");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not open Talk to Kita");
      }
      const payload = (await response.json()) as TalkPayload;
      if (!cancelled) setData(payload);
    }
    void load().catch((loadError) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Could not open Talk to Kita");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || busy || !data) return;

    setBusy(true);
    setError(null);
    setMessage("");

    const optimistic: KitaChatMessage = {
      id: `local-${Date.now()}`,
      userId: "local",
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setData({ ...data, messages: [...data.messages, optimistic] });

    try {
      const response = await submitMessageWithRetry(trimmed);
      const payload = (await response.json()) as TalkPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Kita couldn't reply just now. Please try again.");
      setData(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kita couldn't reply just now. Please try again.",
      );
      const reload = await fetch("/api/kita/talk");
      if (reload.ok) setData((await reload.json()) as TalkPayload);
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <Card padding="relaxed" className="text-center">
        <p className="text-sm text-muted">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!data) {
    return <KitaWorking context="default" message="Opening Talk to Kita..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 kita-enter">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Talk to Kita</p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          Your executive companion
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Ask questions, think out loud, or tell me what deserves your attention. I learn from every
          conversation.
        </p>
      </header>

      {data.curiosityQuestion && (
        <Card className="border-accent/20 bg-accent-soft/40 p-5">
          <Badge variant="muted">Kita is curious</Badge>
          <p className="text-sm leading-relaxed text-foreground">{data.curiosityQuestion}</p>
        </Card>
      )}

      <Card className="max-h-[32rem] overflow-y-auto" padding="relaxed">
        <div className="space-y-4">
          {data.messages.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                entry.role === "assistant"
                  ? "bg-accent-soft text-foreground"
                  : "ml-8 border border-border/80 bg-background text-foreground"
              }`}
            >
              {entry.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Ask Kita anything..."
          className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {error && (
          <p className="text-sm text-warning" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !message.trim()}>
            {busy ? "Kita is thinking..." : "Send"}
          </Button>
          <GiveToKita />
        </div>
      </form>
    </div>
  );
}
