"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLMotionProps<"div"> & {
  strong?: boolean;
  gold?: boolean;
  lift?: boolean;
  padding?: string;
};

export function GlassCard({
  children,
  className,
  strong,
  gold,
  lift = true,
  padding = "p-4 sm:p-6",
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      // initial={false} avoids SSR/client style mismatch (hydration)
      initial={false}
      className={cn(
        "rounded-2xl",
        padding,
        strong ? "glass-strong" : gold ? "glass-gold" : "glass",
        lift && "card-lift",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
