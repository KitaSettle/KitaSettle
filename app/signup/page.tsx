"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated, signUpWithEmail } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isAuthenticated().then((authenticated) => {
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

    const { error: signUpError } = await signUpWithEmail(email, password);
    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      if (message.includes("already registered") || message.includes("already been registered")) {
        setError("An account with this email already exists. Sign in or reset your password.");
      } else if (message.includes("password")) {
        setError("Your password must be at least 6 characters.");
      } else {
        setError("We couldn't create your account. Please try again.");
      }
      setBusy(false);
      return;
    }

    router.push("/dashboard/executive");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <KitaWorking context="auth" compact />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-14">
      <div className="mx-auto w-full max-w-md kita-enter">
        <div className="mb-12">
          <p className="text-lg font-semibold tracking-tight text-foreground">KitaSettle</p>
          <p className="mt-1 text-xs text-muted">Your executive companion</p>
        </div>

        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Get started with your executive companion.
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth disabled={busy} className="h-12 text-base">
            {busy ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
