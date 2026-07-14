interface KitaLogoMarkProps {
  size?: number;
  className?: string;
}

export function KitaLogoMark({ size = 32, className = "" }: KitaLogoMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full text-accent">
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />

        <g className="kita-orbit-pivot animate-[kita-orbit-spin_5s_linear_infinite]">
          <circle
            cx="16"
            cy="4"
            r="1.3"
            fill="currentColor"
            className="animate-[kita-breathe_2.6s_ease-in-out_infinite]"
          />
        </g>
        <g
          className="kita-orbit-pivot animate-[kita-orbit-spin_8s_linear_infinite]"
          style={{ animationDirection: "reverse" }}
        >
          <circle
            cx="24.5"
            cy="16"
            r="1"
            fill="currentColor"
            opacity="0.8"
            className="animate-[kita-breathe_3.1s_ease-in-out_infinite]"
            style={{ animationDelay: "0.6s" }}
          />
        </g>
        <g className="kita-orbit-pivot animate-[kita-orbit-spin_11s_linear_infinite]">
          <circle
            cx="12.5"
            cy="21.9"
            r="0.85"
            fill="currentColor"
            opacity="0.6"
            className="animate-[kita-breathe_3.6s_ease-in-out_infinite]"
            style={{ animationDelay: "1.1s" }}
          />
        </g>
      </svg>

      <span
        className="relative rounded-full bg-accent animate-[kita-breathe_2.4s_ease-in-out_infinite]"
        style={{ width: Math.max(3, size * 0.1), height: Math.max(3, size * 0.1) }}
      />
    </span>
  );
}
