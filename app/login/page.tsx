"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
} from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isAuthenticated().then((authenticated: boolean) => {
      if (authenticated) {
        router.replace("/dashboard/executive");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const signInResult = await signInWithEmail(email, password);
    if (signInResult.error) {
      const signUpResult = await signUpWithEmail(email, password);
      if (signUpResult.error) {
        setError("We couldn't sign you in. Please check your details and try again.");
        setBusy(false);
        return;
      }
    }

    router.push("/dashboard/executive");
  }

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) setError("Sign-in was interrupted. Please try again.");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <KitaWorking context="auth" compact />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-6 py-14 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md kita-enter">
          <div className="mb-12">
            <p className="text-lg font-semibold tracking-tight text-foreground">KitaSettle</p>
            <p className="mt-1 text-xs text-muted">Your executive companion</p>
          </div>

          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Sign in to see what deserves your attention today.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Your password"
                required
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={busy} className="h-12 text-base">
              {busy ? "Opening your day..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 space-y-3">
            <Button type="button" variant="secondary" fullWidth onClick={() => void handleOAuth("google")}>
              Continue with Google
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => void handleOAuth("github")}>
              Continue with GitHub
            </Button>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted">
            First time here? Your account is created automatically when you sign in.
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-surface p-14 lg:flex">
        <div className="max-w-md kita-enter">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Settle your morning
          </p>
          <h2 className="font-display mt-6 text-4xl leading-tight tracking-tight text-foreground">
            Know exactly what deserves your attention.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Kita prepares your brief, surfaces decisions, and remembers what you delegate — so you
            can lead with clarity.
          </p>
        </div>
      </div>
    </div>
  );
}
