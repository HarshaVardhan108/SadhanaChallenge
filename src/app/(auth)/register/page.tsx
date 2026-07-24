"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { VrindavanBackground } from "@/components/ambient/VrindavanBackground";
import { DivineParticles } from "@/components/ambient/DivineParticles";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { countries } from "@/lib/data";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [temple, setTemple] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteRef, setInviteRef] = useState("");
  const [inviterLabel, setInviterLabel] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("ref") || searchParams.get("invite") || "";
    let fromStore = "";
    try {
      fromStore =
        sessionStorage.getItem("bhakti-invite-ref") ||
        localStorage.getItem("bhakti-invite-ref") ||
        "";
    } catch {
      /* ignore */
    }
    const code = (fromQuery || fromStore).trim();
    if (!code) return;
    setInviteRef(code);
    fetch(`/api/invite/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { inviter?: { fullName?: string } } | null) => {
          if (data?.inviter?.fullName) {
            setInviterLabel(data.inviter.fullName);
          }
        }
      )
      .catch(() => null);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!accept) {
      setError("Please accept the Spiritual Challenge.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Provide email or phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          temple,
          city,
          country,
          inviteRef: inviteRef || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { fullName?: string };
      };
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      try {
        localStorage.removeItem("bhakti-challenges");
        localStorage.removeItem("bhakti-guest");
        localStorage.removeItem("bhakti-invite-ref");
        sessionStorage.removeItem("bhakti-invite-ref");
        localStorage.setItem("bhakti-is-new-user", "1");
        localStorage.setItem("bhakti-user", JSON.stringify(data.user || {}));
        // Show Notification_image popup once after first registration
        localStorage.setItem("bhakti-show-welcome-notif", "1");
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
    } catch {
      setError("Cannot reach server or database.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh px-3 py-8 sm:px-4 sm:py-12">
      <VrindavanBackground variant="login" intensity="high" />
      <div className="hidden sm:contents">
        <DivineParticles count={60} />
      </div>

      <motion.div
        initial={false}
        className="relative z-10 mx-auto w-full max-w-2xl"
      >
        <div className="glass-strong rounded-2xl p-5 shadow-2xl sm:rounded-3xl sm:p-8 md:p-10">
          <div className="mb-6 text-center sm:mb-8">
            <span className="text-4xl">🪷</span>
            <h1 className="mt-2 font-serif text-2xl font-bold text-krishna sm:text-3xl">
              Join the Spiritual Challenge
            </h1>
            {inviterLabel ? (
              <p className="mt-2 text-sm text-peacock">
                Invited by <strong>{inviterLabel}</strong>
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Register with email or mobile number
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="devotee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Input
              label="Temple"
              placeholder="ISKCON ..."
              value={temple}
              onChange={(e) => setTemple(e.target.value)}
            />
            <Input
              label="City"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Select
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => setAccept(e.target.checked)}
                className="mt-1 h-4 w-4 accent-krishna"
              />
              <span className="text-sm leading-relaxed">
                I accept the <strong>Spiritual Challenge</strong> with sincerity.
              </span>
            </label>

            {error && (
              <p
                className="sm:col-span-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="gold"
                fullWidth
                size="lg"
                disabled={loading || !accept}
              >
                {loading ? "Creating account…" : "✨ Create Account"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-krishna hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
