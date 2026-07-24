"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { isGuestUser } from "@/lib/guest";
import { PushReminder } from "@/components/pwa/PushReminder";

// Notifications section temporarily disabled
// const reminders = [ ... ];

type ProfileForm = {
  id?: string;
  fullName: string;
  spiritualName: string;
  email: string;
  temple: string;
  city: string;
  country: string;
  phone: string;
  avatarUrl?: string | null;
};

const SPIRITUAL_KEY = "bhakti-spiritual-name";
const GOALS_KEY = "bhakti-sadhana-goals";
const FLUTE_KEY = "bhakti-flute-ambient";

function emptyForm(): ProfileForm {
  return {
    fullName: "",
    spiritualName: "",
    email: "",
    temple: "",
    city: "",
    country: "India",
    phone: "",
  };
}

function loadSpiritualName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SPIRITUAL_KEY) || "";
  } catch {
    return "";
  }
}

function loadGoals(): { rounds: string; reading: string } {
  if (typeof window === "undefined") {
    return { rounds: "16", reading: "20" };
  }
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return { rounds: "16", reading: "20" };
    const p = JSON.parse(raw) as { rounds?: string; reading?: string };
    return {
      rounds: p.rounds || "16",
      reading: p.reading || "20",
    };
  } catch {
    return { rounds: "16", reading: "20" };
  }
}

export default function SettingsPage() {
  const [ready, setReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [rounds, setRounds] = useState("16");
  const [reading, setReading] = useState("20");
  const [flute, setFlute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);

    const goals = loadGoals();
    setRounds(goals.rounds);
    setReading(goals.reading);
    try {
      setFlute(localStorage.getItem(FLUTE_KEY) === "1");
    } catch {
      /* ignore */
    }

    // Seed from local cache first
    try {
      const raw = localStorage.getItem("bhakti-user");
      if (raw) {
        const u = JSON.parse(raw) as {
          id?: string;
          fullName?: string;
          email?: string | null;
          phone?: string | null;
          temple?: string | null;
          city?: string | null;
          country?: string | null;
          avatarUrl?: string | null;
        };
        setForm({
          id: u.id,
          fullName: u.fullName || "",
          spiritualName: loadSpiritualName(),
          email: u.email || "",
          temple: u.temple || "",
          city: u.city || "",
          country: u.country || "India",
          phone: u.phone || "",
          avatarUrl: u.avatarUrl,
        });
      } else {
        setForm((f) => ({ ...f, spiritualName: loadSpiritualName() }));
      }
    } catch {
      /* ignore */
    }

    if (guest) {
      setReady(true);
      return;
    }

    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/user/settings", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(
        ([
          data,
          settingsData,
        ]: [
          {
            user?: {
              id?: string;
              fullName?: string;
              email?: string | null;
              phone?: string | null;
              temple?: string | null;
              city?: string | null;
              country?: string | null;
              avatarUrl?: string | null;
            };
          } | null,
          {
            settings?: {
              spiritualName?: string;
              dailyRounds?: number;
              readingMinutes?: number;
              fluteAmbient?: boolean;
            };
          } | null,
        ]) => {
          if (data?.user) {
            const u = data.user;
            const s = settingsData?.settings;
            setForm({
              id: u.id,
              fullName: u.fullName || "",
              spiritualName: s?.spiritualName || loadSpiritualName(),
              email: u.email || "",
              temple: u.temple || "",
              city: u.city || "",
              country: u.country || "India",
              phone: u.phone || "",
              avatarUrl: u.avatarUrl,
            });
            if (s) {
              if (s.dailyRounds) setRounds(String(s.dailyRounds));
              if (s.readingMinutes) setReading(String(s.readingMinutes));
              if (typeof s.fluteAmbient === "boolean") setFlute(s.fluteAmbient);
              try {
                localStorage.setItem(
                  SPIRITUAL_KEY,
                  s.spiritualName || ""
                );
                localStorage.setItem(
                  GOALS_KEY,
                  JSON.stringify({
                    rounds: String(s.dailyRounds || 16),
                    reading: String(s.readingMinutes || 20),
                  })
                );
                localStorage.setItem(FLUTE_KEY, s.fluteAmbient ? "1" : "0");
              } catch {
                /* ignore */
              }
            }
            try {
              localStorage.setItem("bhakti-user", JSON.stringify(u));
            } catch {
              /* ignore */
            }
          }
        }
      )
      .catch(() => {
        /* offline — keep cache */
      })
      .finally(() => setReady(true));
  }, []);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
    setError(null);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    // Local cache for instant UI (guest + offline)
    try {
      localStorage.setItem(SPIRITUAL_KEY, form.spiritualName.trim());
      localStorage.setItem(
        GOALS_KEY,
        JSON.stringify({ rounds, reading })
      );
      localStorage.setItem(FLUTE_KEY, flute ? "1" : "0");
    } catch {
      /* ignore */
    }

    if (isGuest || !form.id) {
      try {
        const raw = localStorage.getItem("bhakti-user");
        const prev = raw ? JSON.parse(raw) : {};
        const next = {
          ...prev,
          fullName: form.fullName.trim() || prev.fullName,
          email: form.email.trim() || prev.email,
          temple: form.temple.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          phone: form.phone.trim() || prev.phone,
        };
        localStorage.setItem("bhakti-user", JSON.stringify(next));
        setMessage("Saved on this device.");
      } catch {
        setError("Could not save on this device.");
      }
      setSaving(false);
      return;
    }

    try {
      // Profile fields → users table
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          temple: form.temple.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        user?: ProfileForm & { fullName?: string };
        error?: string;
      };

      if (!res.ok || !data.user) {
        setError(data.error || "Update failed.");
        setSaving(false);
        return;
      }

      // Settings extras → user_settings table
      await fetch("/api/user/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spiritualName: form.spiritualName.trim(),
          dailyRounds: Number(rounds) || 16,
          readingMinutes: Number(reading) || 20,
          fluteAmbient: flute,
        }),
      }).catch(() => null);

      const u = data.user;
      setForm((f) => ({
        ...f,
        id: u.id || f.id,
        fullName: u.fullName || f.fullName,
        email: (u.email as string) || "",
        temple: (u.temple as string) || "",
        city: (u.city as string) || "",
        country: (u.country as string) || "India",
        phone: (u.phone as string) || "",
        avatarUrl: u.avatarUrl ?? f.avatarUrl,
      }));

      try {
        localStorage.setItem("bhakti-user", JSON.stringify(u));
      } catch {
        /* ignore */
      }

      setMessage("Profile updated successfully.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-krishna" />
        Loading settings…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Tune your spiritual practice experience"
        emoji="⚙️"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {isGuest && (
          <GlassCard padding="p-4" lift={false} className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              You are browsing as a guest. Log in to sync profile changes to
              your account.
            </p>
            <Link
              href="/please-login?reason=settings&next=/settings"
              className="mt-3 inline-block"
            >
              <Button variant="primary" size="sm">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </GlassCard>
        )}

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">Account</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Display Name"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label="Spiritual Name"
              placeholder="Optional"
              value={form.spiritualName}
              onChange={(e) => setField("spiritualName", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              autoComplete="tel"
              placeholder="Optional if email is set"
            />
            <Input
              label="Temple"
              value={form.temple}
              onChange={(e) => setField("temple", e.target.value)}
              placeholder="e.g. ISKCON Bangalore"
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="e.g. Bangalore"
            />
          </div>

          {message && (
            <p className="mt-3 text-sm font-medium text-tulasi" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            className="mt-4"
            size="sm"
            disabled={saving || !form.fullName.trim()}
            onClick={() => void saveProfile()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Updates your name, contact, and temple on your account. Photo is
            changed from{" "}
            <Link href="/profile" className="font-semibold text-krishna underline">
              Profile
            </Link>
            .
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">
            Sadhana Goals
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select
              label="Daily Rounds"
              value={rounds}
              onChange={(e) => {
                setRounds(e.target.value);
                setMessage(null);
              }}
            >
              {[4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} rounds
                </option>
              ))}
            </Select>
            <Select
              label="Reading minutes/day"
              value={reading}
              onChange={(e) => {
                setReading(e.target.value);
                setMessage(null);
              }}
            >
              {[10, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Goals are saved with your profile when you press Save Changes.
          </p>
        </GlassCard>

        {/* Notifications — hidden for now
        ...
        */}

        <GlassCard>
          <h2 className="mb-3 font-serif text-lg font-bold text-krishna">
            Daily reminders
          </h2>
          <PushReminder />
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">
            Atmosphere
          </h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Krishna&apos;s flute melody</p>
              <p className="text-xs text-[var(--text-muted)]">
                Soft ambient flute while browsing
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={flute}
              onClick={() => {
                setFlute((v) => {
                  const next = !v;
                  try {
                    localStorage.setItem(FLUTE_KEY, next ? "1" : "0");
                  } catch {
                    /* ignore */
                  }
                  return next;
                });
              }}
              className={`relative h-7 w-12 rounded-full transition ${
                flute ? "bg-krishna" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  flute ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
