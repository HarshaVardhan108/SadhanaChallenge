"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({
  className,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      )}
      <input
        className={cn(
          "field-control w-full rounded-xl border border-gold/40 bg-white px-4 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-krishna focus:ring-2 focus:ring-krishna/20 sm:text-sm sm:py-2.5",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Select({
  className,
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      )}
      <select
        className={cn(
          "field-control w-full rounded-xl border border-gold/40 bg-white px-4 py-3 text-base text-[var(--text-primary)] outline-none transition focus:border-krishna focus:ring-2 focus:ring-krishna/20 sm:text-sm sm:py-2.5",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  className,
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      )}
      <textarea
        className={cn(
          "field-control w-full min-h-[120px] resize-y rounded-xl border border-gold/40 bg-white px-4 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-krishna focus:ring-2 focus:ring-krishna/20 sm:text-sm",
          className
        )}
        {...props}
      />
    </label>
  );
}
