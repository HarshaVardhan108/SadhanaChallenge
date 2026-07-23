"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LotusProgress } from "@/components/ui/LotusProgress";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { quotes } from "@/lib/data";
import {
  loadChallengesWithDemo,
  challengeProgress,
  formatChallengeDate,
  getLoggedInUserProfile,
  findMyParticipant,
  getMyJoinedChallenges,
  getParticipantActiveDayAction,
  markOwnActiveDayComplete,
  participantCompletedCount,
  saveChallenges,
  challengePath,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import {
  getDailyStreakSnapshot,
  markTodayComplete,
  type DailyStreakSnapshot,
} from "@/lib/daily-streak";
import { isGuestUser } from "@/lib/guest";
import {
  Flame,
  Sparkles,
  BookOpen,
  ChevronRight,
  Users,
  Globe,
  LogIn,
  UserPlus,
  Check,
} from "lucide-react";

const ringActivities = [
  {
    name: "Challenges",
    detail: "Create path",
    icon: "✨",
    href: "/challenges",
    enabled: true,
  },
  {
    name: "Shlokas",
    detail: "Learn verses",
    icon: "📜",
    href: "/shlokas",
    enabled: true,
  },
  {
    name: "Chanting",
    detail: "Start japa",
    icon: "🕉️",
    href: "/challenges",
    enabled: false,
  },
  {
    name: "Reading",
    detail: "Bhagavad Gita",
    icon: "📖",
    href: "/reading",
    enabled: false,
  },
  {
    name: "Prasadam",
    detail: "Offer food",
    icon: "🍲",
    href: "/challenges/custom",
    enabled: false,
  },
  {
    name: "Seva",
    detail: "Serve",
    icon: "🙏",
    href: "/community",
    enabled: false,
  },
  {
    name: "Gratitude",
    detail: "Journal",
    icon: "✍️",
    href: "/challenges/custom",
    enabled: false,
  },
  {
    name: "Prayer",
    detail: "Arati",
    icon: "🪔",
    href: "/challenges",
    enabled: false,
  },
];

function ChallengeSummaryCard({
  challenge,
  isGuest,
  user,
  onMarkedComplete,
}: {
  challenge: SavedChallenge;
  isGuest: boolean;
  user: LocalUserProfile | null;
  onMarkedComplete?: (next: SavedChallenge[]) => void;
}) {
  const prog = challengeProgress(challenge);
  const accepted = challenge.participants.filter((p) => p.accepted).length;
  const mine = findMyParticipant(challenge, user);
  const myDays = mine ? participantCompletedCount(mine, challenge) : 0;
  const href = challengePath(challenge.id);
  const isPublic = challenge.visibility === "public";
  const isShloka = challenge.type === "shloka";
  const dayAction =
    !isGuest && isShloka && user
      ? getParticipantActiveDayAction(challenge, user)
      : null;
  // Personal progress for logged-in members; group % for guests
  const barPct = mine
    ? Math.round((myDays / Math.max(1, challenge.days)) * 100)
    : prog.pct;

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !dayAction?.canMarkComplete) return;
    const next = markOwnActiveDayComplete(challenge.id, user);
    onMarkedComplete?.(next);
  };

  return (
    <GlassCard
      padding="p-4"
      lift={false}
      className="flex h-full flex-col transition hover:border-krishna/45"
    >
      <Link href={href} className="block min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-bold leading-snug text-krishna">
              {isShloka ? "📜 " : "🎨 "}
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
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isPublic ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-peacock/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-peacock">
                <Globe className="h-3 w-3" />
                Public
              </span>
            ) : (
              <span className="rounded-full bg-tulasi/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800">
                Private
              </span>
            )}
            {mine && (
              <span className="rounded-full bg-krishna px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                Joined
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
              {mine ? ` · You ${myDays}/${challenge.days}` : ""}
            </span>
            <span className="font-bold tabular-nums text-krishna">
              {barPct}%
            </span>
          </div>
          <ProgressBar value={barPct} showLabel={false} height="h-2" />
        </div>

        <p className="mt-3 text-xs font-semibold text-peacock">
          {isGuest ? "View challenge →" : "Open challenge →"}
        </p>
      </Link>

      {/* Shloka challenges: Mark as complete for the active 24h day */}
      {dayAction && dayAction.phase === "active" && (
        <div className="mt-3 border-t border-gold/25 pt-3">
          {dayAction.canMarkComplete ? (
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="sm"
              onClick={handleMarkComplete}
            >
              <Check className="h-4 w-4" />
              Mark day {dayAction.dayNumber} complete
            </Button>
          ) : dayAction.isComplete ? (
            <p className="flex items-center justify-center gap-1.5 rounded-xl border border-tulasi/30 bg-tulasi/10 py-2 text-xs font-semibold text-tulasi">
              <Check className="h-3.5 w-3.5" />
              Day {dayAction.dayNumber} complete
            </p>
          ) : (
            <p className="text-center text-xs text-[var(--text-muted)]">
              Day {dayAction.dayNumber} window not available
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default function DashboardPage() {
  const quote = quotes[0];
  const [displayName, setDisplayName] = useState("Devotee");
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [myChallenges, setMyChallenges] = useState<SavedChallenge[]>([]);
  const [streak, setStreak] = useState<DailyStreakSnapshot | null>(null);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);
    setStreak(getDailyStreakSnapshot());

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

  /** Logged-in: only challenges created/joined (synced with Challenges hub). */
  const joinedChallenges = useMemo(
    () => getMyJoinedChallenges(myChallenges, user),
    [myChallenges, user]
  );

  const listedChallenges = isGuest ? publicChallenges : joinedChallenges;

  const myShlokaChallenges = useMemo(
    () => joinedChallenges.filter((c) => c.type === "shloka"),
    [joinedChallenges]
  );

  const handleMarkToday = () => {
    setStreak(markTodayComplete());
  };

  const refreshChallenges = (next: SavedChallenge[]) => {
    setMyChallenges(next);
  };

  const handleMarkShlokaDay = (challengeId: string) => {
    const profile = getLoggedInUserProfile();
    if (!profile) return;
    const next = markOwnActiveDayComplete(challengeId, profile);
    setMyChallenges(next);
  };

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
                onMarkedComplete={refreshChallenges}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mark as complete — only when in one or more shloka challenges */}
      {!isGuest && user && myShlokaChallenges.length > 0 && (
        <GlassCard strong padding="p-4 sm:p-5" lift={false}>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-krishna" />
            <div>
              <h2 className="font-serif text-lg font-bold text-krishna">
                Mark as complete
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Your active shloka challenge day (24-hour window)
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {myShlokaChallenges.map((c) => {
              const action = getParticipantActiveDayAction(c, user);
              if (!action) return null;
              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-gold/30 bg-cream/40 px-3 py-3 sm:px-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-krishna">
                        📜 {c.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {action.phase === "not_started" &&
                          "Challenge has not started yet"}
                        {action.phase === "finished" &&
                          "Challenge days are finished"}
                        {action.phase === "active" &&
                          `Day ${action.dayNumber} of ${c.days}`}
                      </p>
                    </div>
                    {action.phase === "active" && action.canMarkComplete && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkShlokaDay(c.id)}
                      >
                        <Check className="h-4 w-4" />
                        Mark as complete
                      </Button>
                    )}
                    {action.phase === "active" && action.isComplete && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tulasi/15 px-2.5 py-1 text-xs font-semibold text-tulasi">
                        <Check className="h-3.5 w-3.5" />
                        Completed today
                      </span>
                    )}
                    {action.phase === "active" &&
                      !action.canMarkComplete &&
                      !action.isComplete && (
                        <span className="text-xs text-[var(--text-muted)]">
                          Window closed
                        </span>
                      )}
                  </div>
                  <Link
                    href={challengePath(c.id)}
                    className="mt-2 inline-flex text-xs font-semibold text-peacock hover:underline"
                  >
                    Open challenge →
                  </Link>
                </li>
              );
            })}
          </ul>
        </GlassCard>
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
          <GlassCard strong padding="p-4 sm:p-6" lift={false}>
            <div className="flex flex-col items-center">
              <LotusProgress
                completed={streak?.lotusCompleted ?? 0}
                total={streak?.lotusTotal ?? 21}
                size={180}
                title="YOUR LOTUS GARDEN"
              />
              <p className="mt-2 max-w-sm text-center text-sm text-[var(--text-muted)]">
                Synced with your{" "}
                <strong className="font-semibold text-krishna">
                  Daily Streak
                </strong>
                — not challenges. Mark today to bloom a petal.
              </p>
              <p className="mt-1 text-xs font-medium text-peacock">
                Streak {streak?.currentStreak ?? 0} day
                {(streak?.currentStreak ?? 0) === 1 ? "" : "s"} · Garden{" "}
                {streak?.lotusCompleted ?? 0}/{streak?.lotusTotal ?? 21}
              </p>
              <div className="mt-4 w-full max-w-xs">
                {streak?.markedToday ? (
                  <Button variant="outline" fullWidth disabled>
                    <Check className="h-4 w-4" />
                    Today&apos;s offering marked
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleMarkToday}
                  >
                    <Flame className="h-4 w-4" />
                    Mark today&apos;s offering
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ringActivities.map((a) =>
                a.enabled ? (
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
                ) : (
                  <div
                    key={a.name}
                    aria-disabled="true"
                    title="Coming soon"
                    className="flex min-h-14 cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-xl border border-gold/20 bg-cream/50 px-2 py-2 text-center opacity-40"
                  >
                    <span className="text-lg grayscale">{a.icon}</span>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {a.name}
                    </span>
                  </div>
                )
              )}
            </div>
          </GlassCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <GlassCard gold padding="p-4" lift={false}>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-saffron">
                <Flame className="h-3.5 w-3.5" /> Daily Streak
              </p>
              <p className="mt-1 font-serif text-4xl font-bold text-krishna">
                {streak?.currentStreak ?? 0}
              </p>
              <p className="text-sm text-peacock">
                {(streak?.currentStreak ?? 0) > 0
                  ? `Best ever: ${streak?.bestStreak ?? 0} days · same as lotus`
                  : "Mark today’s offering to start your streak"}
              </p>
              {!streak?.markedToday && (
                <button
                  type="button"
                  onClick={handleMarkToday}
                  className="mt-3 text-xs font-semibold text-krishna underline-offset-2 hover:underline"
                >
                  Mark today →
                </button>
              )}
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
                {
                  label: "Streak",
                  value: String(streak?.currentStreak ?? 0),
                  icon: "🔥",
                },
                {
                  label: "Days marked",
                  value: String(streak?.totalDays ?? 0),
                  icon: "🪷",
                },
                {
                  label: "Garden %",
                  value: `${streak?.lotusPercent ?? 0}%`,
                  icon: "📜",
                },
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
