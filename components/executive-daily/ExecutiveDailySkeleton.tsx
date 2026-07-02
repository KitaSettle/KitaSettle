import { Card } from "@/components/ui/Card";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-accent/10 ${className}`} />;
}

export function ExecutiveDailySkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="mt-3 h-4 w-80" />
      </div>

      <div className="flex flex-wrap gap-3">
        <SkeletonBlock className="h-7 w-36" />
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-7 w-52" />
      </div>

      <Card className="p-8">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="mt-6 h-24 w-full" />
        <SkeletonBlock className="mt-6 h-20 w-full" />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-6">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-4 h-24 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
