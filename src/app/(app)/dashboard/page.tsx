"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LotusProgress } from "@/components/ui/LotusProgress";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { quotes, festivals } from "@/lib/data";
import {
  loadChallengesWithDemo,
  challengeProgress,
  formatChallengeDate,
  getLoggedInUserProfile,
  findMyParticipant,
  saveChallenges,
  challengePath,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import { isGuestUser } from "@/lib/guest";
import {
  Flame,
  CloudSun,
  Calendar,
  Sparkles,
  BookOpen,
  ChevronRight,
  Users,
  Globe,
  LogIn,
  UserPlus,
} from "lucide-react";

const ringActivities = [
  { name: "Chanting", detail: "Start japa", icon: "🕉️", href: "/challenges" },
  { name: "Reading", detail: "Bhagavad Gita", icon: "📖", href: "/reading" },
  { name: "Shlokas", detail: "Learn verses", icon: "📜", href: "/shlokas" },
  { name: "Challenges", detail: "Create path", icon: "✨", href: "/challenges" },
  { name: "Prasadam", detail: "Offer food", icon: "🍲", href: "/challenges/custom" },
  { name: "Seva", detail: "Serve", icon: "🙏", href: "/community" },
  { name: "Gratitude", detail: "Journal", icon: "✍️", href: "/challenges/custom" },
  { name: "Prayer", detail: "Arati", icon: "🪔", href: "/challenges" },
];

function ChallengeSummaryCard({
  challenge,
  isGuest,
  user,
}: {
  challenge: SavedChallenge;
  isGuest: boolean;
  user: LocalUserProfile | null;
}) {
  const prog = challengeProgress(challenge);
  const accepted = challenge.participants.filter((p) => p.accepted).length;
  const mine = findMyParticipant(challenge, user);
  const href = challengePath(challenge.id);
  const isPublic = challenge.visibility === "public";

  return (
    <Link href={href} className="block">
      <GlassCard
        padding="p-4"
        lift={false}
        className="flex h-full flex-col transition hover:border-krishna/45 active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-bold leading-snug text-krishna">
              {challenge.type === "shloka" ? "📜 " : "🎨 "}
              {challenge.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              {challenge.days} days
              {isPublic ? " · Public" : " · Private"}
              {challenge.createdBy ? ` · by ${challenge.createdBy}` : ""}
              {challenge.createdAt
                ? ` · ${formatChallengeDate(challenge.createdAt)}`
                : ""}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              ID: {challenge.id}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isPublic ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-peacock/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-peacock">
                <Globe className="h-3 w-3" />
                Public
              </span>
            ) : (
              <span className="rounded-full bg-tulasi/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                Active
              </span>
            )}
            {mine && (
              <span className="rounded-full bg-krishna px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                You
              </span>
            )}
            <ChevronRight className="h-5 w-5 text-peacock" />
          </div>
        </div>

        {challenge.goal && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--text-primary)]">
            {challenge.goal}
          </p>
        )}

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
              <Users className="h-3.5 w-3.5" />
              {accepted} joined
            </span>
            <span className="font-bold tabular-nums text-krishna">
              {prog.pct}%
            </span>
          </div>
          <ProgressBar value={prog.pct} showLabel={false} height="h-2" />
        </div>

        <p className="mt-3 text-xs font-semibold text-peacock">
          {isGuest ? "View challenge →" : "Open challenge →"}
        </p>
      </GlassCard>
    </Link>
  );
}

export default function DashboardPage() {
  const quote = quotes[0];
  const nextFestivals = festivals.filter((f) => f.daysLeft > 0).slice(0, 2);
  const [displayName, setDisplayName] = useState("Devotee");
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [myChallenges, setMyChallenges] = useState<SavedChallenge[]>([]);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);

    if (guest) {
      setDisplayName("Guest");
      setUser(null);
      const list = loadChallengesWithDemo();
      setMyChallenges(list);
      saveChallenges(list);
      return;
    }

    const profile = getLoggedInUserProfile();
    setUser(profile);
    if (profile?.fullName) {
      setDisplayName(profile.fullName.split(" ")[0]);
    }
    const list = loadChallengesWithDemo();
    setMyChallenges(list);
    saveChallenges(list);

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            user?: LocalUserProfile & { fullName?: string };
          } | null
        ) => {
          if (data?.user?.fullName) {
            const next: LocalUserProfile = {
              id: data.user.id,
              fullName: data.user.fullName,
              email: data.user.email,
            };
            setUser(next);
            setDisplayName(data.user.fullName.split(" ")[0]);
            try {
              localStorage.setItem("bhakti-user", JSON.stringify(data.user));
            } catch {
              /* ignore */
            }
          }
        }
      )
      .catch(() => {
        /* offline / unauthenticated */
      });
  }, []);

  const publicChallenges = useMemo(
    () => myChallenges.filter((c) => c.visibility === "public"),
    [myChallenges]
  );

  const listedChallenges = isGuest ? publicChallenges : myChallenges;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Greeting */}
      <GlassCard gold padding="p-4 sm:p-5" lift={false}>
        <p className="text-xs font-semibold uppercase tracking-wide text-peacock">
          {isGuest ? "Guest · Browse only" : "Welcome · New journey"}
        </p>
        <p className="mt-1 font-serif text-2xl font-bold leading-tight text-krishna sm:text-3xl">
          Hare Krishna, {isGuest ? "Guest" : displayName}!
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          {isGuest
            ? "You are browsing as a guest. Explore public challenges below — log in to join, create challenges, and track your sadhana."
            : listedChallenges.length > 0
              ? "Your challenges are blooming below. Keep offering your daily sadhana."
              : "Begin Your Journey Back Home, Back to Godhead. Create your first challenge to start blooming your lotus garden."}
        </p>

        {isGuest ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="flex-1">
              <Button variant="primary" fullWidth>
                <LogIn className="h-4 w-4" />
                Login to Join
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="gold" fullWidth>
                <UserPlus className="h-4 w-4" />
                Create Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/challenges/custom" className="flex-1">
              <Button variant="primary" fullWidth>
                <Sparkles className="h-4 w-4" />
                Create Custom Challenge
              </Button>
            </Link>
            <Link href="/challenges/shloka" className="flex-1">
              <Button variant="gold" fullWidth>
                <BookOpen className="h-4 w-4" />
                Create Shloka Challenge
              </Button>
            </Link>
          </div>
        )}
      </GlassCard>

      {/* Challenges — guests only see public ones */}
      {listedChallenges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-lg font-bold text-krishna sm:text-xl">
              {isGuest ? "Public Challenges" : "Your Challenges"}
            </h2>
            {!isGuest && (
              <Link
                href="/challenges"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-peacock hover:underline sm:text-sm"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {isGuest && (
            <p className="text-sm text-[var(--text-muted)]">
              Tap a challenge to open its page and view others&apos; progress.
              Log in to join and track your own days.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {listedChallenges.map((c) => (
              <ChallengeSummaryCard
                key={c.id}
                challenge={c}
                isGuest={isGuest}
                user={user}
              />
            ))}
          </div>
        </section>
      )}

      {isGuest && publicChallenges.length === 0 && (
        <GlassCard padding="p-5" lift={false}>
          <p className="text-sm text-[var(--text-muted)]">
            No public challenges are available right now. Log in to create one
            and invite devotees.
          </p>
          <Link href="/login" className="mt-3 block max-w-xs">
            <Button variant="primary" fullWidth>
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </GlassCard>
      )}

      {/* Guest: stop here — no full app widgets */}
      {isGuest ? (
        <GlassCard padding="p-4" lift={false} className="text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Full features — lotus garden, streaks, profile, and private challenges —
            unlock when you log in.
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <GlassCard
              padding="p-3 sm:p-4"
              className="flex items-center gap-3"
              lift={false}
            >
              <CloudSun className="h-8 w-8 shrink-0 text-saffron" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">
                  Vrindavan weather
                </p>
                <p className="font-serif text-lg font-bold text-krishna">
                  28°C · Morning
                </p>
              </div>
            </GlassCard>
            <GlassCard
              padding="p-3 sm:p-4"
              className="flex items-center gap-3"
              lift={false}
            >
              <Calendar className="h-8 w-8 shrink-0 text-krishna" />
              <div>
                <p className="text-xs text-[var(--text-muted)]">Upcoming</p>
                {nextFestivals[0] ? (
                  <p className="text-sm font-semibold text-peacock">
                    {nextFestivals[0].emoji} {nextFestivals[0].name} ·{" "}
                    {nextFestivals[0].daysLeft}d
                  </p>
                ) : (
                  <p className="text-sm text-krishna">See festivals</p>
                )}
              </div>
            </GlassCard>
          </div>

          {nextFestivals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nextFestivals.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-2.5 py-1 text-xs font-medium text-krishna"
                >
                  {f.emoji} {f.name} · {f.daysLeft} Days Left
                </span>
              ))}
            </div>
          )}

          <GlassCard strong padding="p-4 sm:p-6" lift={false}>
            <div className="flex flex-col items-center">
              <LotusProgress
                completed={0}
                total={21}
                size={180}
                title="YOUR LOTUS GARDEN"
              />
              <p className="mt-2 max-w-sm text-center text-sm text-[var(--text-muted)]">
                Complete your first day of sadhana to bloom a petal.
              </p>
              <Link href="/challenges" className="mt-4 w-full max-w-xs">
                <Button variant="primary" fullWidth>
                  Start a Challenge
                </Button>
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ringActivities.map((a) => (
                <Link
                  key={a.name}
                  href={a.href}
                  className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-gold/35 bg-cream px-2 py-2 text-center active:bg-white"
                >
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-xs font-semibold text-krishna">
                    {a.name}
                  </span>
                </Link>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <GlassCard gold padding="p-4" lift={false}>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-saffron">
                <Flame className="h-3.5 w-3.5" /> Daily Streak
              </p>
              <p className="mt-1 font-serif text-4xl font-bold text-krishna">
                0
              </p>
              <p className="text-sm text-peacock">Days · Start today!</p>
            </GlassCard>

            <GlassCard padding="p-4" lift={false}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-peacock">
                Today&apos;s Inspiration
              </p>
              <p className="mt-2 font-serif text-sm leading-relaxed text-indigo italic sm:text-base">
                “{quote.meaning || quote.text}”
              </p>
              <p className="mt-2 text-xs font-medium text-krishna">
                — {quote.source}
              </p>
            </GlassCard>
          </div>

          <GlassCard padding="p-4" lift={false}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              My Stats
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Rounds", value: "0", icon: "🕉️" },
                { label: "Reading", value: "0 hrs", icon: "📖" },
                { label: "Shlokas", value: "0", icon: "📜" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-gold/30 bg-cream px-2 py-3 text-center"
                >
                  <span className="text-lg">{s.icon}</span>
                  <p className="mt-0.5 font-serif text-lg font-bold text-krishna">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
