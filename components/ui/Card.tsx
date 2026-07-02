import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "default" | "relaxed" | "none";
}

const paddingStyles = {
  default: "p-6",
  relaxed: "p-8",
  none: "p-0",
};

export function Card({ children, className = "", padding = "default" }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
