"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
      <div className={cn("w-full overflow-hidden rounded-full bg-cream border border-gold/20", height)}>
        <motion.div
          className={cn("h-full rounded-full progress-shimmer", !color && "bg-krishna")}
          style={color ? { background: color } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{clamped}%</p>
      )}
    </div>
  );
}
