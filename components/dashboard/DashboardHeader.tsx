import { formatTodayDate, getGreeting } from "@/lib/formatDate";

interface DashboardHeaderProps {
  name: string;
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  return (
    <header className="mb-10 kita-enter">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Today</p>
      <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {getGreeting(name)}
      </h1>
      <p className="mt-3 text-base text-muted">{formatTodayDate()}</p>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/80">
        Here is what deserves your attention — prepared quietly, while you were away.
      </p>
    </header>
  );
}
