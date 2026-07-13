"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { achievements } from "@/lib/data";

type ProfileUser = {
  id?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  temple?: string | null;
  city?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
};

export default function ProfilePage() {
  const unlocked = achievements.filter((a) => a.unlocked);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bhakti-user");
      if (raw) {
        const u = JSON.parse(raw) as ProfileUser;
        setUser(u);
        if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
      }
    } catch {
      /* ignore */
    }

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: ProfileUser } | null) => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl);
          try {
            localStorage.setItem("bhakti-user", JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* guest */
      });
  }, []);

  const displayName = user?.fullName || "Devotee";
  const initial = (displayName.trim()[0] || "H").toUpperCase();
  const templeLine = [user?.temple, user?.city || user?.country]
    .filter(Boolean)
    .join(" · ");

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        ok?: boolean;
        avatarUrl?: string;
        user?: ProfileUser;
        error?: string;
      };

      if (!res.ok || !data.avatarUrl) {
        setError(data.error || "Upload failed.");
        return;
      }

      setAvatarUrl(data.avatarUrl);
      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem("bhakti-user", JSON.stringify(data.user));
        } catch {
          /* ignore */
        }
      } else {
        try {
          const raw = localStorage.getItem("bhakti-user");
          const prev = raw ? (JSON.parse(raw) as ProfileUser) : {};
          localStorage.setItem(
            "bhakti-user",
            JSON.stringify({ ...prev, avatarUrl: data.avatarUrl })
          );
        } catch {
          /* ignore */
        }
      }
      setMessage("Profile photo updated.");
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your spiritual identity card" emoji="🙏" />

      <GlassCard gold className="mb-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-krishna to-peacock text-5xl shadow-xl ring-4 ring-gold/50">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`${displayName} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white">{initial}</span>
              )}
            </div>
            <button
              type="button"
              onClick={onPickFile}
              disabled={uploading}
              aria-label="Upload profile photo"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-cream text-krishna shadow-md transition hover:bg-white disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-serif text-2xl font-bold text-krishna">
              {displayName}
            </h2>
            <p className="text-peacock">
              Spiritual name pending · Aspiring devotee
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {templeLine ? `🛕 ${templeLine}` : "🛕 Temple not set"}
            </p>
            {message && (
              <p className="mt-2 text-sm font-medium text-tulasi">{message}</p>
            )}
            {error && (
              <p className="mt-2 text-sm font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Click the camera icon to upload a photo (JPG/PNG/WebP, max 5 MB).
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
              <Stat label="Followers" value="0" />
              <Stat label="Following" value="0" />
              <Stat label="Streak" value="0" />
              <Stat label="Lotus Pts" value="0" />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={onPickFile}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
              <Link href="/invite">
                <Button variant="gold" size="sm">
                  Invite Friends
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Daily Rounds", value: "0", pct: 0 },
          { label: "Books", value: "0", pct: 0 },
          { label: "Shlokas", value: "0", pct: 0 },
          { label: "Streak", value: "0 days", pct: 0 },
        ].map((s) => (
          <GlassCard key={s.label} padding="p-4">
            <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            <p className="font-serif text-xl font-bold text-krishna">{s.value}</p>
            <ProgressBar value={s.pct} className="mt-2" showLabel={false} />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mb-8">
        <h3 className="font-serif text-lg font-bold text-krishna">
          Favorite Quote
        </h3>
        <p className="mt-3 font-sanskrit text-xl text-krishna">
          कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।
        </p>
        <p className="mt-2 text-sm italic text-[var(--text-muted)]">
          You have a right to perform your prescribed duty, but not to the
          fruits of action.
        </p>
        <p className="mt-2 text-sm font-medium text-peacock">
          — Bhagavad Gita 2.47
        </p>
      </GlassCard>

      <h3 className="mb-4 font-serif text-xl font-bold text-krishna">
        Achievements Showcase
      </h3>
      <div className="flex flex-wrap gap-3">
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="glass card-lift flex items-center gap-2 rounded-2xl px-4 py-3"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm font-medium text-krishna">{a.name}</span>
          </div>
        ))}
        <Link
          href="/achievements"
          className="flex items-center rounded-2xl border border-dashed border-gold/50 px-4 py-3 text-sm text-peacock hover:bg-white/40"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-cream px-4 py-2 text-center">
      <p className="font-serif text-lg font-bold text-krishna">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  );
}
