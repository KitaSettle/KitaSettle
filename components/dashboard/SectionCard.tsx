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
  default: "border-border",
  warning: "border-warning/20",
  success: "border-success/20",
};

export function SectionCard({
  title,
  subtitle,
  accent = "default",
  className = "",
  children,
}: SectionCardProps) {
  return (
    <Card className={`h-full ${accentStyles[accent]} ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}
