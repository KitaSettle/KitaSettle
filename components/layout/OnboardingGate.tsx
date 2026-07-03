"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isOnboardingAllowedPath } from "@/lib/auth/onboarding-paths";
import { KitaWorking } from "@/components/ui/KitaWorking";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      if (isOnboardingAllowedPath(pathname)) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const response = await fetch("/api/executive-dna/status");
        if (!response.ok) {
          if (!cancelled) setReady(true);
          return;
        }

        const status = (await response.json()) as {
          needsDiscovery?: boolean;
          interviewComplete?: boolean;
        };

        const needsDiscovery =
          status.needsDiscovery !== false && status.interviewComplete !== true;

        if (needsDiscovery) {
          router.replace("/dashboard/discovery");
          return;
        }
      } catch {
        // Allow render on transient failures; discovery page handles its own errors.
      }

      if (!cancelled) setReady(true);
    }

    void checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <KitaWorking context="discovery" compact />
      </div>
    );
  }

  return children;
}
