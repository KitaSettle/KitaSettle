"use client";

import { useEffect, useRef, useState } from "react";
import { TalkToKitaPanel } from "./TalkToKitaPanel";

export function KitaQuickAccess() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk to Kita"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-surface shadow-lg transition-transform duration-200 hover:scale-105 kita-glass dark:shadow-[0_0_28px_-6px_var(--color-accent)]"
      >
        <span className="relative flex h-8 w-8 items-center justify-center" aria-hidden>
          <svg className="absolute inset-0 h-full w-full text-accent" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20" />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="40 42"
              className="origin-center animate-[kita-orbit-spin_4s_linear_infinite]"
            />
          </svg>
          <span className="relative h-2 w-2 rounded-full bg-accent animate-[kita-breathe_2.4s_ease-in-out_infinite]" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Talk to Kita">
          <button
            type="button"
            className="absolute inset-0 bg-scrim backdrop-blur-sm"
            onClick={close}
            aria-label="Close Talk to Kita"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="kita-glass absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border/80 bg-surface shadow-2xl outline-none sm:w-[90vw]"
          >
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-5">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Kita — quick access</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <TalkToKitaPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
