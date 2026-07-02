import { Card } from "@/components/ui/Card";
import { KitaWorking } from "@/components/ui/KitaWorking";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-accent/8 ${className}`} />;
}

export function ExecutiveDailySkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10">
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
        <SkeletonBlock className="mt-4 h-4 w-48" />
        <SkeletonBlock className="mt-5 h-4 w-96 max-w-full" />
      </div>

      <div className="mb-8 flex min-h-[12rem] items-center justify-center rounded-3xl border border-border/80 bg-surface">
        <KitaWorking context="executive" compact />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="relaxed">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-5 h-24 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
