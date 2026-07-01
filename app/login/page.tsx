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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dan@kitasettle.com");
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void isAuthenticated().then((authenticated: boolean) => {
      if (authenticated) {
        router.replace("/dashboard");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const signInResult = await signInWithEmail(email, password);
    if (signInResult.error) {
      const signUpResult = await signUpWithEmail(email, password);
      if (signUpResult.error) {
        setError(signUpResult.error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  }

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) setError(oauthError.message);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              KitaSettle
            </p>
            <p className="text-xs text-muted">Alpha</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-3 text-muted">
            Every morning, know exactly what deserves your attention.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => void handleOAuth("google")}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => void handleOAuth("github")}
            >
              Continue with GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            New accounts are created automatically on first sign-in.
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-surface p-12 lg:flex">
        <div className="max-w-md">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Executive Intelligence Platform
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Wake up knowing exactly what deserves your attention.
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            KitaSettle prepares, analyses, and recommends — so you can focus on
            leadership. You decide. We settle the rest.
          </p>
        </div>
      </div>
    </div>
  );
}
