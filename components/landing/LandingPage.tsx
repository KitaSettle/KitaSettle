"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { withTimeout } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";

const AUTH_CHECK_TIMEOUT_MS = 10_000;

export function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void withTimeout(isAuthenticated(), AUTH_CHECK_TIMEOUT_MS)
      .then((authenticated) => {
        if (cancelled) return;
        if (authenticated) {
          router.replace("/dashboard/executive");
          return;
        }
        setChecking(false);
      })
      .catch((error) => {
        console.error("[KitaSettle] Landing auth check failed:", error);
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <KitaWorking context="landing" compact />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="kita-enter flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">KitaSettle</p>
            <p className="text-xs text-muted">For executives who decide</p>
          </div>
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="kita-enter kita-enter-delay-1 text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Your morning, settled
            </p>
            <h1 className="kita-enter kita-enter-delay-2 font-display mt-6 text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Wake up knowing exactly what deserves your attention.
            </h1>
            <p className="kita-enter kita-enter-delay-3 mt-8 max-w-xl text-lg leading-relaxed text-muted">
              Kita reads your world, surfaces what matters, and prepares your day — calmly,
              quietly, before you even ask.
            </p>

            <div className="kita-enter mt-12 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button className="h-12 px-8 text-base">Create account</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="h-12 px-8 text-base">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <div className="kita-enter mt-20 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Executive Brief",
                body: "Your priorities, risks, and opportunities — prepared each morning.",
              },
              {
                title: "Give this to Kita",
                body: "Drop a document, link, or note. Kita understands and remembers.",
              },
              {
                title: "Decisions first",
                body: "The highest-value move for today, with clear reasoning.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border/80 bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="py-8 text-xs text-muted">
          You decide. Kita settles the rest.
        </footer>
      </div>
    </div>
  );
}
