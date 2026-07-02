"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getForgotPasswordErrorMessage, resetPasswordForEmail } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: resetError } = await resetPasswordForEmail(email);
    if (resetError) {
      setError(getForgotPasswordErrorMessage(resetError));
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-14">
      <div className="mx-auto w-full max-w-md kita-enter">
        <div className="mb-12">
          <p className="text-lg font-semibold tracking-tight text-foreground">KitaSettle</p>
          <p className="mt-1 text-xs text-muted">Your executive companion</p>
        </div>

        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Reset your password
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Enter your email and we&apos;ll send you a link to choose a new password.
        </p>

        {sent ? (
          <div className="mt-10 space-y-6">
            <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-foreground" role="status">
              If an account exists for {email}, you&apos;ll receive a reset link shortly. Check your
              inbox and spam folder.
            </p>
            <Link href="/login" className="block text-center text-sm text-accent underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
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

            {error && (
              <p className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={busy} className="h-12 text-base">
              {busy ? "Sending reset link..." : "Send reset link"}
            </Button>

            <p className="text-center text-sm text-muted">
              <Link href="/login" className="text-accent underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
