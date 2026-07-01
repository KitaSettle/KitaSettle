"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, login } from "@/lib/auth";
import { mockUser } from "@/data/mockUser";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(mockUser.email);
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login();
    router.push("/dashboard");
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
                placeholder="Enter any password"
                required
              />
            </div>

            <Button type="submit" fullWidth>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Alpha preview — any credentials will sign you in.
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
