interface BrainToastProps {
  message: string;
}

export function BrainToast({ message }: BrainToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-foreground px-5 py-3 text-sm font-medium text-surface shadow-lg"
    >
      {message}
    </div>
  );
}
