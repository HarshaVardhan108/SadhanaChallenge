"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VrindavanBackground } from "@/components/ambient/VrindavanBackground";
import { Button } from "@/components/ui/Button";
import { Loader2, LogIn, UserPlus } from "lucide-react";

/**
 * Public invite landing: /join/{code}
 * Stores ref in sessionStorage and sends user to register.
 */
export default function JoinInvitePage() {
  const params = useParams();
  const router = useRouter();
  const raw = typeof params?.code === "string" ? params.code : "";
  const code = decodeURIComponent(raw);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invite/${encodeURIComponent(code)}`);
        const data = (await res.json()) as {
          ok?: boolean;
          inviter?: { fullName?: string; code?: string };
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.inviter) {
          setError(data.error || "This invite link is invalid or expired.");
          setLoading(false);
          return;
        }
        setInviterName(data.inviter.fullName || "a devotee");
        try {
          sessionStorage.setItem("bhakti-invite-ref", data.inviter.code || code);
          localStorage.setItem("bhakti-invite-ref", data.inviter.code || code);
        } catch {
          /* ignore */
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Could not open invite. Check your connection.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const goRegister = () => {
    router.push(`/register?ref=${encodeURIComponent(code)}`);
  };

  return (
    <div className="relative min-h-dvh px-4 py-12">
      <VrindavanBackground variant="login" intensity="high" />
      <motion.div
        initial={false}
        className="relative z-10 mx-auto w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-6 text-center shadow-2xl sm:p-8">
          <span className="text-4xl" aria-hidden>
            🪷
          </span>
          <h1 className="mt-3 font-serif text-2xl font-bold text-krishna">
            You&apos;re invited
          </h1>

          {loading && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening invite…
            </p>
          )}

          {error && !loading && (
            <>
              <p className="mt-4 text-sm text-rose-600">{error}</p>
              <Link href="/register" className="mt-6 inline-block w-full">
                <Button variant="primary" fullWidth>
                  Register anyway
                </Button>
              </Link>
              <Link
                href="/login"
                className="mt-3 inline-block text-sm font-medium text-peacock hover:underline"
              >
                Already have an account? Login
              </Link>
            </>
          )}

          {inviterName && !loading && !error && (
            <>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                <strong className="text-krishna">{inviterName}</strong> invited
                you to join{" "}
                <strong className="text-krishna">Sadhana Challenge</strong> —
                walk together back home, back to Godhead.
              </p>
              <Button
                variant="gold"
                fullWidth
                className="mt-6"
                onClick={goRegister}
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>
              <Link href="/login" className="mt-3 inline-block w-full">
                <Button variant="outline" fullWidth>
                  <LogIn className="h-4 w-4" />
                  I already have an account
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
