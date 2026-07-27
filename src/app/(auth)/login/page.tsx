"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { VrindavanBackground } from "@/components/ambient/VrindavanBackground";
import { DivineParticles } from "@/components/ambient/DivineParticles";
import { FluteAmbient } from "@/components/ambient/FluteAmbient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogIn, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enterAsGuest = () => {
    try {
      localStorage.removeItem("bhakti-challenges");
      localStorage.setItem("bhakti-is-new-user", "1");
      localStorage.setItem("bhakti-guest", "1");
      localStorage.removeItem("bhakti-user");
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Enter email or mobile number, and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          remember,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { fullName?: string; email?: string | null };
      };
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      try {
        localStorage.removeItem("bhakti-guest");
        localStorage.setItem("bhakti-is-new-user", "1");
        localStorage.setItem(
          "bhakti-user",
          JSON.stringify(data.user || {})
        );
        localStorage.removeItem("bhakti-challenges");
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
    } catch {
      setError("Cannot reach server. Is the app and database running?");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <VrindavanBackground variant="login" intensity="high" />
      <div className="hidden sm:contents">
        <DivineParticles count={80} />
      </div>
      <div className="hidden sm:block">
        <FluteAmbient />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[5%] -translate-x-1/2 text-center sm:top-[8%]">
          <motion.div
            className="text-5xl sm:text-6xl md:text-7xl"
            initial={false}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌳
          </motion.div>
          <motion.div
            className="relative -mt-5 text-4xl sm:-mt-6 sm:text-5xl md:text-6xl"
            initial={false}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🕉️
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={false}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-5 shadow-2xl sm:rounded-3xl sm:p-8 md:p-10">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl shadow-lg ring-2 ring-gold/50 sm:h-20 sm:w-20 sm:rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt="Sadhana Challenge lotus"
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="font-serif text-2xl font-bold text-krishna sm:text-3xl">
              Sadhana Challenge
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Begin Your Journey Back Home,
              <br />
              <span className="font-medium text-peacock">Back to Godhead</span>
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleLogin}>
            <Input
              label="Email or Mobile Number"
              type="text"
              autoComplete="username"
              placeholder="email@example.com or 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-krishna"
                />
                Remember Me
              </label>
              <span className="text-krishna/70">Forgot Password?</span>
            </div>

            <Button
              type="submit"
              variant="gold"
              fullWidth
              size="lg"
              disabled={loading}
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <div className="relative my-4 text-center">
            <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
              or
            </span>
          </div>

          <Button variant="ghost" fullWidth size="lg" onClick={enterAsGuest}>
            <User className="h-4 w-4" />
            Continue as Guest
          </Button>


          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">New to the spiritual journey?</p>
            <Link
              href="/register"
              className="mt-2 inline-block font-semibold text-peacock transition hover:text-krishna"
            >
              Create Account → Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
