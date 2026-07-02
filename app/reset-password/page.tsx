"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPasswordResetErrorMessage, isAuthenticated, updatePassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <KitaWorking context="auth" compact />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isAuthenticated().then((authenticated) => {
      if (!authenticated) {
        router.replace("/login?error=recovery");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(getPasswordResetErrorMessage(updateError));
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
          Set a new password
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New password
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Repeat your password"
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
            {busy ? "Updating password..." : "Update password"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/login" className="text-accent underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
