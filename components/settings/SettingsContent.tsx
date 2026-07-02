"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Bright and airy" },
  { value: "dark", label: "Dark", description: "Easy on the eyes" },
  { value: "system", label: "System", description: "Follows your device" },
];

export function SettingsContent() {
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/users/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { name?: string; email?: string } | null) => {
        if (data) {
          setProfile({
            name: data.name || "Executive",
            email: data.email || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSignOut() {
    void signOut().then(() => router.replace("/login"));
  }

  if (loading) {
    return <KitaWorking context="settings" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 kita-enter">
      <header>
        <p className="text-sm font-medium text-accent">Settings</p>
        <h1 className="font-display mt-2 text-3xl tracking-tight text-foreground sm:text-4xl">
          Your preferences
        </h1>
        <p className="mt-3 text-muted">A calm space to personalise how Kita works for you.</p>
      </header>

      <Card padding="relaxed">
        <h2 className="text-lg font-semibold text-foreground">Account</h2>
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-base text-foreground">{profile?.name ?? "Executive"}</dd>
          </div>
          {profile?.email && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-1 text-base text-foreground">{profile.email}</dd>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/discovery">
            <Button variant="secondary">Update how Kita knows you</Button>
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      <Card padding="relaxed">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            <p className="mt-2 text-sm text-muted">
              Currently using {resolvedTheme === "dark" ? "dark" : "light"} mode
              {theme === "system" ? " (from your device)" : ""}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme preference">
          {themeOptions.map((option) => {
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(option.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface-muted/40 hover:border-border hover:bg-surface-muted"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="mt-1 text-xs text-muted">{option.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card padding="relaxed">
        <h2 className="text-lg font-semibold text-foreground">About KitaSettle</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          KitaSettle helps executives start each day with clarity — a prepared brief, clear
          decisions, and a growing memory of what matters to you.
        </p>
      </Card>
    </div>
  );
}
