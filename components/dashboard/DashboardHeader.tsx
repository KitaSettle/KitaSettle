import { formatTodayDate, getGreeting } from "@/lib/formatDate";

interface DashboardHeaderProps {
  name: string;
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  return (
    <header className="mb-8">
      <p className="text-sm font-medium text-accent">Executive Brief</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {getGreeting(name)}
      </h1>
      <p className="mt-2 text-muted">{formatTodayDate()}</p>
      <p className="mt-3 text-sm text-foreground/80">
        Your Executive Brief is ready.
      </p>
    </header>
  );
}
