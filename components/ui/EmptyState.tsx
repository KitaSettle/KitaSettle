import { type ReactNode } from "react";

interface EmptyStateProps {
  children: ReactNode;
  className?: string;
}

export function EmptyState({ children, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border/80 bg-surface-muted/30 px-6 py-8 text-center text-sm leading-relaxed text-muted ${className}`}
    >
      {children}
    </div>
  );
}
