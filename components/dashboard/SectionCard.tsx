import { type ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  accent?: "default" | "warning" | "success";
  className?: string;
  children: ReactNode;
}

const accentStyles = {
  default: "border-border/80",
  warning: "border-warning/30",
  success: "border-success/30",
};

export function SectionCard({
  title,
  subtitle,
  accent = "default",
  className = "",
  children,
}: SectionCardProps) {
  return (
    <Card className={`h-full ${accentStyles[accent]} ${className}`} padding="relaxed">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}
