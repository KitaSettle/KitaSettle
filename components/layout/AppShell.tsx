"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSignOutErrorMessage, isAuthenticated, onAuthStateChange, signOut } from "@/lib/auth";
import { withTimeout } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { KitaQuickAccess } from "@/components/kita/KitaQuickAccess";
import { MobileNav } from "./MobileNav";
import { OnboardingGate } from "./OnboardingGate";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

const AUTH_CHECK_TIMEOUT_MS = 10_000;

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void withTimeout(isAuthenticated(), AUTH_CHECK_TIMEOUT_MS)
      .then((authenticated: boolean) => {
        if (cancelled) return;
        if (!authenticated) {
          const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
          router.replace(`/login${next}`);
          return;
        }
        setReady(true);
      })
      .catch((error) => {
        console.error("[KitaSettle] Auth check failed:", error);
        if (cancelled) return;
        const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${next}`);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChange((authenticated) => {
      if (authenticated) return;

      // A single "signed out" event can be a transient blip during token
      // refresh rather than a real sign-out. Re-verify directly before
      // bouncing the user out of whatever they're doing.
      void isAuthenticated()
        .then((stillAuthenticated) => {
          if (cancelled || stillAuthenticated) return;
          const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
          router.replace(`/login${next}`);
        })
        .catch((error) => {
          console.error("[KitaSettle] Auth re-check after sign-out event failed:", error);
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [pathname, router]);

  async function handleLogout() {
    setLogoutError(null);
    const { error } = await signOut();
    if (error) {
      setLogoutError(getSignOutErrorMessage());
      return;
    }
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <KitaWorking context="auth" compact />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="kita-glass hidden w-72 shrink-0 border-r border-border/80 bg-surface dark:bg-surface/60 lg:block">
          <Sidebar onLogout={() => void handleLogout()} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <MobileNav onLogout={() => void handleLogout()}>
            <header className="kita-glass hidden items-center justify-end border-b border-border/80 bg-surface/80 px-10 py-5 backdrop-blur lg:flex">
              {logoutError && (
                <p className="mr-4 text-sm text-warning" role="alert">
                  {logoutError}
                </p>
              )}
              <Button variant="ghost" onClick={() => void handleLogout()}>
                Sign out
              </Button>
            </header>

            <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
              <OnboardingGate>{children}</OnboardingGate>
            </main>
          </MobileNav>
        </div>
      </div>

      {pathname !== "/dashboard/talk" && <KitaQuickAccess />}
    </div>
  );
}
