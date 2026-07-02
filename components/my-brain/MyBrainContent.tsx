"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrainInsightsPayload } from "@/lib/types/brain-insights";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { GiveToKita } from "@/components/intake/GiveToKita";
import { SectionCard } from "@/components/dashboard/SectionCard";

function ConfidenceRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="rounded-3xl border border-border/80 bg-background/60 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {!Number.isNaN(clamped) && !label.toLowerCase().includes("learning progress") && (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-accent">{clamped}%</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyBrainContent() {
  const [data, setData] = useState<BrainInsightsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/my-brain");
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Failed to load My Brain");
    }
    setData((await response.json()) as BrainInsightsPayload);
  }, []);

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load");
    });
  }, [load]);

  if (error) {
    return (
      <Card padding="relaxed" className="text-center text-sm text-muted">
        Kita couldn&apos;t open My Brain right now. Please refresh and try again.
      </Card>
    );
  }

  if (!data) {
    return <KitaWorking context="brain" message="I'm gathering what I understand about you..." />;
  }

  const timelineGroups = data.howILearn.reduce<Record<string, typeof data.howILearn>>((acc, item) => {
    acc[item.periodLabel] = [...(acc[item.periodLabel] ?? []), item];
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-8 kita-enter">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">My Brain</p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          How Kita understands you
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          A calm look inside our working relationship — what I know, how I learn, and where I can
          do better for you.
        </p>
      </header>

      <SectionCard title="What I understand" subtitle="Confidence, explained in plain language">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.whatIUnderstand.map((item) => (
            <div key={item.id} className="space-y-3">
              <ConfidenceRing value={item.confidence} label={item.label} />
              <p className="text-sm leading-relaxed text-muted">{item.summary}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-accent-soft/50 px-5 py-4">
          <p className="text-sm font-medium text-foreground">{data.learningProgressLabel}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{data.learningProgressSummary}</p>
        </div>
      </SectionCard>

      <SectionCard title="How I learn" subtitle="The story of how our working relationship is growing">
        {Object.keys(timelineGroups).length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">
            When you share documents, answer questions, or use your brief, I quietly learn more
            about how you work.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(timelineGroups).map(([period, moments]) => (
              <div key={period}>
                <p className="text-sm font-semibold text-foreground">{period}</p>
                <ul className="mt-3 space-y-2">
                  {moments.map((moment) => (
                    <li key={moment.id} className="text-sm leading-relaxed text-muted">
                      • {moment.story}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Help me understand you better"
        subtitle="I could help you even more if you gave me..."
      >
        <ul className="space-y-3">
          {data.helpMeUnderstand.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/80 bg-background/60 px-5 py-4"
            >
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted">{item.reason}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <GiveToKita onDelegated={() => void load()} />
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="My strengths" subtitle="Where I can already help you well">
          <ul className="space-y-3">
            {data.strengths.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="My limitations" subtitle="Where I am still learning — honestly">
          <ul className="space-y-3">
            {data.limitations.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-muted">
                • {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
