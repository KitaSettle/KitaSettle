"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config/env";
import { KitaWorking } from "@/components/ui/KitaWorking";

const DEFAULT_NEXT = "/dashboard/executive";
const RESET_PASSWORD_PATH = "/reset-password";

function resolveRedirectPath(next: string | null, type: string | null): string {
  if (type === "recovery" || next === RESET_PASSWORD_PATH) {
    return RESET_PASSWORD_PATH;
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return DEFAULT_NEXT;
}

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/login?error=auth");
      return;
    }

    const supabase = createClient();
    const next = searchParams.get("next");
    const type = searchParams.get("type");
    const redirectPath = resolveRedirectPath(next, type);

    async function completeAuth() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const hashType = hashParams.get("type");
      const finalPath =
        hashType === "recovery" || type === "recovery" || next === RESET_PASSWORD_PATH
          ? RESET_PASSWORD_PATH
          : redirectPath;

      if (hash.includes("access_token") || hash.includes("error")) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          setError("This sign-in link is invalid or has expired.");
          return;
        }

        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        router.replace(finalPath);
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        setError("This sign-in link is invalid or has expired.");
        return;
      }

      router.replace(finalPath);
    }

    void completeAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <p className="max-w-md text-center text-sm text-warning" role="alert">
          {error}
        </p>
        <a href="/login" className="mt-6 text-sm text-accent underline-offset-4 hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <KitaWorking context="auth" compact />
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <KitaWorking context="auth" compact />
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
