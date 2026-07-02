interface BrainToastProps {
  message: string;
}

export function BrainToast({ message }: BrainToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-[kita-fade-in_0.3s_ease-out] rounded-2xl border border-border/80 bg-foreground px-6 py-3.5 text-sm font-medium text-background shadow-lg"
    >
      {message}
    </div>
  );
}
