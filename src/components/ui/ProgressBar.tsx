"use client";

import { cn } from "@/lib/utils";

/**
 * CSS-based progress bar (no framer-motion enter animation).
 * Avoids SSR/client hydration mismatches from animated width.
 */
export function ProgressBar({
  value,
  className,
  color,
  showLabel = true,
  height = "h-2.5",
}: {
  value: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  height?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full border border-gold/20 bg-cream",
          height
        )}
      >
        <div
          className={cn(
            "h-full rounded-full progress-shimmer transition-[width] duration-700 ease-out",
            !color && "bg-krishna"
          )}
          style={{
            width: `${clamped}%`,
            ...(color ? { background: color } : null),
          }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
          {clamped}%
        </p>
      )}
    </div>
  );
}
