"use client";

import { Button } from "@/components/ui/Button";

export default function DiscoveryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-semibold text-foreground">Unable to continue</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        We couldn&apos;t load your getting-to-know-you conversation. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
