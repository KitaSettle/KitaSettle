"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ExecutiveDailyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-semibold text-foreground">Unable to load today&apos;s brief</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {error.message || "Something went wrong while preparing your executive brief."}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
