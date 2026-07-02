"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { KitaWorking } from "@/components/ui/KitaWorking";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void isAuthenticated().then((authenticated: boolean) => {
      if (!authenticated) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [router]);

  function handleLogout() {
    void signOut().then(() => {
      router.replace("/login");
    });
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
        <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-surface lg:block">
          <Sidebar onLogout={handleLogout} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <MobileNav onLogout={handleLogout}>
            <header className="hidden items-center justify-end border-b border-border/80 bg-surface/80 px-10 py-5 backdrop-blur lg:flex">
              <Button variant="ghost" onClick={handleLogout}>
                Sign out
              </Button>
            </header>

            <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
          </MobileNav>
        </div>
      </div>
    </div>
  );
}
