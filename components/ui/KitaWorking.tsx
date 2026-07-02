"use client";

import { useEffect, useState } from "react";
import {
  KITA_LOADING_MESSAGES,
  type KitaLoadingContext,
} from "@/lib/copy/kita-messages";

interface KitaWorkingProps {
  context?: KitaLoadingContext;
  message?: string;
  compact?: boolean;
  className?: string;
}

export function KitaWorking({
  context = "default",
  message,
  compact = false,
  className = "",
}: KitaWorkingProps) {
  const messages = KITA_LOADING_MESSAGES[context];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (message || messages.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [message, messages.length]);

  const text = message ?? messages[index];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "gap-3 py-8" : "gap-5 py-16"} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-12 w-12 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-accent/10 animate-[kita-breathe_2.4s_ease-in-out_infinite]" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-accent animate-[kita-breathe_2.4s_ease-in-out_infinite]" />
      </div>
      <p
        key={text}
        className={`max-w-sm text-muted animate-[kita-fade-in_0.4s_ease-out] ${compact ? "text-sm" : "text-base leading-relaxed"}`}
      >
        {text}
      </p>
    </div>
  );
}
