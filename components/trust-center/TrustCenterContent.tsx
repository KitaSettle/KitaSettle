"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "@/lib/auth";
import type { TrustCenterPayload, TrustDeleteScope } from "@/lib/types/trust-center";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Bright and airy" },
  { value: "dark", label: "Dark", description: "Easy on the eyes" },
  { value: "system", label: "System", description: "Follows your device" },
];

const KITA_PROMISE = [
  "We only learn from what you choose to share.",
  "We explain our recommendations.",
  "We admit uncertainty.",
  "We protect your privacy.",
  "We help you think.",
  "We never replace your judgment.",
];

const DELETE_COPY: Record<
  TrustDeleteScope,
  { title: string; body: string; confirm: string }
> = {
  documents: {
    title: "Delete uploaded documents",
    body: "This removes files and notes you have given to Kita. Your brief and decisions will have less context afterward.",
    confirm: "Delete my documents",
  },
  knowledge: {
    title: "Delete saved knowledge",
    body: "This permanently removes knowledge items Kita has saved for you. This cannot be undone.",
    confirm: "Delete my knowledge",
  },
  memory: {
    title: "Delete Executive Memory",
    body: "This clears captured context, notes, and memory entries. Kita will forget past conversations and saved context.",
    confirm: "Delete my memory",
  },
  account: {
    title: "Delete your account",
    body: "This permanently removes your account, profile, brief history, and everything Kita knows about you.",
    confirm: "Delete my account",
  },
};

export function TrustCenterContent() {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [data, setData] = useState<TrustCenterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyScope, setBusyScope] = useState<TrustDeleteScope | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/trust-center");
    if (!response.ok) throw new Error("Failed to load Trust Center");
    setData((await response.json()) as TrustCenterPayload);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setMessage("Trust Center could not load right now."))
      .finally(() => setLoading(false));
  }, [load]);

  async function handleExport(format: "json" | "zip") {
    window.location.href = `/api/trust-center/export?format=${format}`;
  }

  async function handleDelete(scope: TrustDeleteScope) {
    const copy = DELETE_COPY[scope];
    const confirmed = window.confirm(`${copy.title}\n\n${copy.body}\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    setBusyScope(scope);
    setMessage(null);

    try {
      const response = await fetch("/api/trust-center/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, confirm: true }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Deletion failed");

      setMessage(payload.message ?? "Done.");
      if (scope === "account") {
        await signOut();
        router.replace("/login");
        return;
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Deletion failed");
    } finally {
      setBusyScope(null);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/integrations/google/disconnect", { method: "POST" });
    await load();
    setMessage("Google has been disconnected.");
  }

  if (loading) {
    return <KitaWorking context="settings" message="Opening your Trust Center..." />;
  }

  if (!data) {
    return (
      <Card padding="relaxed" className="text-center text-sm text-muted">
        {message ?? "Trust Center is unavailable right now."}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 kita-enter">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Trust Center</p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          Trust, explained beautifully
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Everything about how Kita learns from you, protects you, and stays honest about what it
          knows.
        </p>
      </header>

      {message && (
        <div className="rounded-2xl border border-border/80 bg-accent-soft/40 px-5 py-4 text-sm text-foreground">
          {message}
        </div>
      )}

      <SectionCard title="Your relationship with Kita" subtitle="Time together and what we have built">
        <p className="text-sm text-muted">
          You&apos;ve been working with Kita for{" "}
          <span className="font-semibold text-foreground">{data.relationship.daysTogetherLabel}</span>
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Documents learned", data.relationship.documentsLearned],
            ["Meetings understood", data.relationship.meetingsUnderstood],
            ["Projects", data.relationship.projects],
            ["Decisions", data.relationship.decisions],
            ["Estimated hours saved", data.relationship.estimatedHoursSaved],
            ["Executive Brain confidence", `${data.relationship.executiveBrainConfidence}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-background/70 px-4 py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-2 text-xl font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-muted">{data.relationship.learningProgress}</p>
      </SectionCard>

      <Card padding="relaxed" className="border-accent/20 bg-gradient-to-br from-surface to-accent-soft/20">
        <h2 className="font-display text-2xl tracking-tight text-foreground">The Kita Promise</h2>
        <ul className="mt-6 space-y-3">
          {KITA_PROMISE.map((line) => (
            <li key={line} className="text-sm leading-relaxed text-foreground">
              • {line}
            </li>
          ))}
        </ul>
      </Card>

      <SectionCard title="Privacy" subtitle="How Kita treats what you share">
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          <li>• Kita only learns from information you choose to share.</li>
          <li>• Kita never secretly reads your conversations.</li>
          <li>• Kita never sells your information.</li>
          <li>• Kita never shares your documents with other users.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Permissions" subtitle="What Kita can access — and when">
        <div className="space-y-4">
          {data.permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/60 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {permission.provider} · {permission.label}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {permission.connected ? "Connected" : "Not connected"} · {permission.lastSyncLabel}
                </p>
                {permission.accountEmail && (
                  <p className="mt-1 text-xs text-muted">{permission.accountEmail}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {permission.connectUrl && (
                  <Button onClick={() => { window.location.href = permission.connectUrl!; }}>
                    Connect
                  </Button>
                )}
                {permission.disconnectAction === "google" && permission.connected && (
                  <Button variant="ghost" onClick={() => void handleDisconnect()}>
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Export your data" subtitle="One click — everything you have shared with Kita">
        <p className="text-sm leading-relaxed text-muted">
          Download a copy of your knowledge, memory, Executive DNA, uploaded documents, decision
          history, and settings.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void handleExport("json")}>
            Export JSON
          </Button>
          <Button variant="secondary" onClick={() => void handleExport("zip")}>
            Export ZIP
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Delete your data" subtitle="Clear, honest consequences">
        <div className="space-y-4">
          {(Object.keys(DELETE_COPY) as TrustDeleteScope[]).map((scope) => (
            <div key={scope} className="rounded-2xl border border-border/80 bg-background/60 px-5 py-4">
              <p className="text-sm font-medium text-foreground">{DELETE_COPY[scope].title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{DELETE_COPY[scope].body}</p>
              <Button
                variant="ghost"
                className="mt-4"
                disabled={busyScope != null}
                onClick={() => void handleDelete(scope)}
              >
                {busyScope === scope ? "Working..." : DELETE_COPY[scope].confirm}
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <Card padding="relaxed">
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-2 text-sm text-muted">
          Currently using {resolvedTheme === "dark" ? "dark" : "light"} mode
          {theme === "system" ? " (from your device)" : ""}.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                theme === option.value
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface-muted/40 hover:bg-surface-muted"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              <p className="mt-1 text-xs text-muted">{option.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card padding="relaxed">
        <h2 className="text-lg font-semibold text-foreground">Account</h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-base text-foreground">{data.account.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-base text-foreground">{data.account.email}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/my-brain">
            <Button variant="secondary">Open My Brain</Button>
          </Link>
          <Link href="/dashboard/discovery">
            <Button variant="ghost">Update how Kita knows you</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
