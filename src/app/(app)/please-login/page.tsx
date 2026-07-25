"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";

function PleaseLoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const reason = searchParams.get("reason");

  const message =
    reason === "join"
      ? "Please log in to join this challenge and track your sadhana with the community."
      : "Please log in to access this page. Guests can only browse the dashboard and public challenges.";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-2 py-8">
      <GlassCard strong gold className="w-full text-center" padding="p-6 sm:p-8">
        <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl shadow-md ring-2 ring-gold/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Sadhana Challenge lotus"
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-peacock">
          Account required
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-krishna sm:text-3xl">
          Please Login
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/login" className="block">
            <Button variant="primary" fullWidth size="lg">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
          <Link href="/register" className="block">
            <Button variant="gold" fullWidth size="lg">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </Link>
          <Link href="/dashboard" className="block">
            <Button variant="ghost" fullWidth size="md">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {next && next !== "/dashboard" && (
          <p className="mt-4 text-[11px] text-[var(--text-muted)]">
            After login you can continue to:{" "}
            <span className="font-medium text-krishna">{next}</span>
          </p>
        )}
      </GlassCard>
    </div>
  );
}

export default function PleaseLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <PleaseLoginContent />
    </Suspense>
  );
}
