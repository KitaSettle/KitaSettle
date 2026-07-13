"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { KitaChatMessage } from "@/lib/repositories/kita-chat-repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { GiveToKita } from "@/components/intake/GiveToKita";
import { KitaOrbit } from "@/components/kita/KitaOrbit";
import { useVoiceChat } from "@/lib/kita/use-voice-chat";
import { fetchKitaConversation, sendKitaMessage, type TalkPayload } from "@/lib/kita/submit-message";

const VOICE_STATE_LABEL: Record<string, string> = {
  idle: "Tap to talk to Kita",
  listening: "Listening...",
  thinking: "Kita is thinking...",
  speaking: "Kita is speaking...",
};

export function TalkToKitaPanel() {
  const [data, setData] = useState<TalkPayload | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const voiceChat = useVoiceChat({
    onMessagesUpdated: (payload) => setData(payload),
    onError: (message) => setError(message),
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const payload = await fetchKitaConversation();
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
      const payload = await sendKitaMessage(trimmed);
      setData(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kita couldn't reply just now. Please try again.",
      );
      try {
        setData(await fetchKitaConversation());
      } catch {
        // keep the optimistic state if reload also fails
      }
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
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Talk to Kita</p>
          <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
            Your executive companion
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Ask questions, think out loud, or tell me what deserves your attention. I learn from every
            conversation.
          </p>
        </div>

        {!voiceChat.active && voiceChat.supportStatus !== "checking" && (
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => voiceChat.start()}
              disabled={!voiceChat.isSupported}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:shadow-none dark:text-background dark:shadow-[0_0_24px_-4px_var(--color-accent)] dark:disabled:shadow-none"
            >
              <MicIcon />
              Talk to Kita
            </button>
            {voiceChat.supportStatus === "unsupported" && (
              <p className="max-w-[16rem] text-right text-xs text-muted">
                Voice chat needs Chrome, Edge, or Safari. Text chat below works everywhere.
              </p>
            )}
          </div>
        )}
      </header>

      {data.curiosityQuestion && (
        <Card className="border-accent/20 bg-accent-soft/40 p-5">
          <Badge variant="muted">Kita is curious</Badge>
          <p className="text-sm leading-relaxed text-foreground">{data.curiosityQuestion}</p>
        </Card>
      )}

      {voiceChat.permissionDenied && (
        <p className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning" role="alert">
          Kita couldn&apos;t access your microphone. Check your browser&apos;s site permissions, or keep
          using text chat below.
        </p>
      )}

      {voiceChat.active && (
        <Card padding="relaxed" className="text-center">
          <KitaOrbit
            state={voiceChat.state}
            audioLevel={voiceChat.audioLevel}
            speakingPulse={voiceChat.speakingPulse}
          />
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-accent">
            {VOICE_STATE_LABEL[voiceChat.state]}
          </p>
          <p className="mx-auto mt-3 min-h-[1.5rem] max-w-md text-sm leading-relaxed text-muted">
            {voiceChat.interimTranscript || " "}
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => voiceChat.stop()}>
            Stop voice chat
          </Button>
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

function MicIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
      />
    </svg>
  );
}
