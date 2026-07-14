"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchAccountHint,
  getLoginErrorMessage,
  getOAuthErrorMessage,
  isAuthenticated,
  signInWithEmail,
  signInWithOAuth,
} from "@/lib/auth";
import { DEFAULT_POST_LOGIN_PATH } from "@/lib/auth/post-login";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { KitaLogoMark } from "@/components/ui/KitaLogoMark";

const URL_ERROR_MESSAGES: Record<string, string> = {
  auth: "Sign-in was interrupted or the link expired. Please try again.",
  recovery: "Your password reset link has expired. Request a new one.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <KitaWorking context="auth" compact />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError && URL_ERROR_MESSAGES[urlError]) {
      setError(URL_ERROR_MESSAGES[urlError]);
    }
  }, [searchParams]);

  useEffect(() => {
    void isAuthenticated().then((authenticated: boolean) => {
      if (authenticated) {
        router.replace(DEFAULT_POST_LOGIN_PATH);
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
      const accountHint = await fetchAccountHint(email);
      setError(getLoginErrorMessage(signInResult.error, accountHint));
      setBusy(false);
      return;
    }

    router.push(searchParams.get("next") ?? DEFAULT_POST_LOGIN_PATH);
  }

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) setError(getOAuthErrorMessage(oauthError, provider));
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
          <div className="mb-12 flex items-center gap-3">
            <KitaLogoMark size={32} />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-foreground">KitaSettle</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Your executive companion</p>
            </div>
          </div>

          <h1 className="font-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
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
                className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-surface/60 dark:kita-glass"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-surface/60 dark:kita-glass"
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

          <p className="mt-8 text-center text-sm text-muted">
            New to KitaSettle?{" "}
            <Link href="/signup" className="text-accent underline-offset-4 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>

      <div className="kita-glass relative hidden flex-1 items-center justify-center overflow-hidden bg-surface p-14 lg:flex">
        <svg
          className="pointer-events-none absolute right-[-120px] top-1/2 h-[520px] w-[520px] -translate-y-1/2 text-accent opacity-[0.07]"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <div className="max-w-md kita-enter relative">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Settle your morning
          </p>
          <h2 className="font-display mt-6 text-4xl font-light leading-tight tracking-tight text-foreground">
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
