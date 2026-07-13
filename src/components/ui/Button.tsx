"use client";

import { forwardRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-krishna text-white hover:bg-[#16408a] shadow-md shadow-krishna/25",
  secondary:
    "bg-peacock text-white hover:bg-[#005a63] shadow-md shadow-peacock/20",
  outline:
    "bg-white text-krishna border border-gold/60 hover:bg-cream active:bg-cream",
  ghost: "bg-transparent text-krishna hover:bg-cream active:bg-cream",
  gold: "bg-gradient-to-r from-gold via-[#ffe082] to-gold text-[#1a2f5a] font-semibold shadow-md shadow-gold/40",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
};

type Ripple = { id: number; x: number; y: number };

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  glow?: boolean;
  children?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      glow = true,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const sizes = {
      sm: "min-h-10 px-3 py-2 text-sm rounded-xl",
      md: "min-h-11 px-5 py-2.5 text-sm rounded-xl",
      lg: "min-h-12 px-6 py-3.5 text-base rounded-2xl sm:px-7",
    };

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((r) => [...r, { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((item) => item.id !== id)), 600);
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 overflow-hidden font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          glow && "btn-glow",
          className
        )}
        {...props}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/50"
            style={{
              left: r.x,
              top: r.y,
              width: 12,
              height: 12,
              marginLeft: -6,
              marginTop: -6,
              animation: "click-ripple 0.6s ease-out forwards",
            }}
          />
        ))}
        <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
