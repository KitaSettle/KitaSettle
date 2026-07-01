"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

interface MobileNavProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export function MobileNav({ children, onLogout }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">KitaSettle</span>
        <div className="w-10" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} onLogout={onLogout} />
          </div>
        </div>
      )}

      {children}
    </>
  );
}
