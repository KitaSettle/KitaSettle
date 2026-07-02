"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    void isAuthenticated().then((authenticated: boolean) => {
      router.replace(authenticated ? "/dashboard/executive" : "/login");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
    </div>
  );
}
