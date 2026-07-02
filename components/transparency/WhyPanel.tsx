"use client";

import { useState } from "react";
import type { WhyTransparency } from "@/lib/types/transparency";
import { Button } from "@/components/ui/Button";

interface WhyPanelProps {
  transparency: WhyTransparency;
  className?: string;
}

export function WhyPanel({ transparency, className = "" }: WhyPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <Button variant="ghost" className="px-0 text-accent" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide why" : "Why?"}
      </Button>

      {open && (
        <div className="mt-4 space-y-4 rounded-2xl border border-border/80 bg-background/70 p-5 animate-[kita-fade-in_0.3s_ease-out]">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Why this matters</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{transparency.whyMatters}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Why now</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{transparency.whyNow}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Confidence</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {transparency.confidence}% — {transparency.confidenceLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">What I used</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {transparency.informationUsed.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">What would help</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {transparency.informationMissing.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
