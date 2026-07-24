"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isGuestUser } from "@/lib/guest";
import {
  challengePath,
  findMyParticipant,
  formatChallengeDate,
  getChallengeLeaderboardRows,
  getLoggedInUserProfile,
  getMyPublicChallenges,
  loadChallengesWithDemo,
  saveChallenges,
  type LeaderboardRow,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import {
  ChevronRight,
  Crown,
  Globe,
  LogIn,
  Trophy,
  Users,
} from "lucide-react";

/**
 * Pandava league labels from days completed vs challenge length.
 * Sequence (highest → lowest): Yuddhistir → Bhima → Arjuna → Nakul → Sahadev
 */
function leagueForDays(daysCompleted: number, totalDays: number) {
  const pct =
    totalDays <= 0 ? 0 : Math.round((daysCompleted / totalDays) * 100);
  if (pct >= 80)
    return { name: "Yuddhistir", className: "bg-gold/40 text-krishna" };
  if (pct >= 60)
    return { name: "Bhima", className: "bg-krishna/15 text-krishna" };
  if (pct >= 40)
    return { name: "Arjuna", className: "bg-lotus/50 text-krishna" };
  if (pct >= 20)
    return { name: "Nakul", className: "bg-sky/40 text-peacock" };
  return { name: "Sahadev", className: "bg-cream text-[var(--text-muted)]" };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarTone(rank: number): string {
  if (rank === 1) return "from-gold to-[#ffe082]"; // Golden
  if (rank === 2) return "from-krishna to-peacock"; // Blue
  if (rank === 3) return "from-lotus to-[#ffd6dc]"; // Light pink
  return "from-krishna to-peacock";
}

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function podiumTier(rank: number): 1 | 2 | 3 {
  if (rank <= 1) return 1;
  if (rank === 2) return 2;
  return 3;
}

/** Shared podium person card (size differs mobile vs desktop). */
function PodiumCard({
  row,
  totalDays,
  compact = false,
}: {
  row: LeaderboardRow;
  totalDays: number;
  compact?: boolean;
}) {
  const league = leagueForDays(row.daysCompleted, totalDays);
  const rank = row.rank;
  const tier = podiumTier(rank);
  const heights = compact
    ? { 1: "h-14", 2: "h-10", 3: "h-8" }
    : { 1: "h-24", 2: "h-16", 3: "h-14" };
  // Podium steps: 1st golden, 2nd blue, 3rd light pink
  const plinth =
    tier === 1
      ? "from-gold via-[#ffe082] to-gold/70"
      : tier === 2
        ? "from-krishna/80 via-peacock/60 to-sky/50"
        : "from-lotus via-[#ffd6dc] to-lotus/50";
  const avatar = compact
    ? "h-11 w-11 text-[11px]"
    : "h-14 w-14 text-sm";

  return (
    <div className="flex w-full min-w-0 flex-col items-center px-0.5">
      {rank === 1 && (
        <Crown
          className={cn("mb-0.5 text-gold", compact ? "h-4 w-4" : "h-5 w-5")}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md",
          avatar,
          avatarTone(rank)
        )}
      >
        {initials(row.name)}
      </div>
      <p
        className={cn(
          "mt-1 w-full truncate px-0.5 text-center font-semibold",
          compact ? "text-[10px] leading-tight" : "text-xs",
          row.isYou ? "text-peacock" : "text-krishna"
        )}
        title={row.name}
      >
        {row.name}
        {row.isYou ? " ·You" : ""}
      </p>
      <div
        className={cn(
          "mt-0.5 inline-flex items-center gap-0.5 font-bold tabular-nums text-peacock",
          compact ? "text-[10px]" : "text-xs"
        )}
      >
        <Trophy
          className={cn("shrink-0 text-gold", compact ? "h-2.5 w-2.5" : "h-3 w-3")}
        />
        {row.daysCompleted}
        <span className="font-normal text-[var(--text-muted)]">
          /{totalDays}
        </span>
      </div>
      {!compact && (
        <span
          className={cn(
            "mt-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            league.className
          )}
        >
          {league.name}
        </span>
      )}
      <div
        className={cn(
          "mt-1.5 flex w-full flex-col items-center justify-end rounded-t-lg bg-gradient-to-b sm:mt-2 sm:rounded-t-xl",
          plinth,
          heights[tier]
        )}
      >
        <span
          className={cn(
            "mb-1 font-serif font-bold text-krishna/80",
            compact ? "text-base" : "mb-1.5 text-2xl"
          )}
          title={`Rank ${rank}`}
        >
          {rankBadge(rank)}
        </span>
      </div>
    </div>
  );
}

/**
 * Mobile podium — compact 3-column stage (2nd | 1st | 3rd).
 * Ties stack as small avatars in the same column.
 */
function MobilePodium({
  rank1,
  rank2,
  rank3,
  totalDays,
}: {
  rank1: LeaderboardRow[];
  rank2: LeaderboardRow[];
  rank3: LeaderboardRow[];
  totalDays: number;
}) {
  const columns: { rank: number; rows: LeaderboardRow[]; order: string }[] = [
    { rank: 2, rows: rank2, order: "order-1" },
    { rank: 1, rows: rank1, order: "order-2" },
    { rank: 3, rows: rank3, order: "order-3" },
  ];

  return (
    <div className="sm:hidden">
      <div className="grid grid-cols-3 items-end gap-1.5 px-2 pb-1 pt-1">
        {columns.map(({ rank, rows, order }) => (
          <div
            key={rank}
            className={cn(
              "flex min-w-0 flex-col items-center justify-end gap-2",
              order
            )}
          >
            {rows.length === 0 ? (
              <div
                className="flex w-full flex-col items-center opacity-35"
                aria-hidden
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed bg-cream text-xs text-[var(--text-muted)]",
                    rank === 1
                      ? "border-gold/60"
                      : rank === 2
                        ? "border-krishna/40"
                        : "border-lotus/70"
                  )}
                >
                  —
                </div>
                <div
                  className={cn(
                    "mt-1.5 w-full rounded-t-lg bg-gradient-to-b to-cream",
                    rank === 1
                      ? "h-14 from-gold/30"
                      : rank === 2
                        ? "h-10 from-krishna/20"
                        : "h-8 from-lotus/30"
                  )}
                />
              </div>
            ) : (
              rows.map((row) => (
                <PodiumCard
                  key={row.participantId}
                  row={row}
                  totalDays={totalDays}
                  compact
                />
              ))
            )}
          </div>
        ))}
      </div>
      {/* Tie strip: if many on one rank, names stay readable below */}
      {(rank1.length > 1 || rank2.length > 1 || rank3.length > 1) && (
        <p className="px-3 pb-3 text-center text-[10px] text-[var(--text-muted)]">
          Tied ranks share the same step on the podium
        </p>
      )}
    </div>
  );
}

/** Mobile-friendly full-width rank row (same columns every time). */
function RankListItem({
  row,
  totalDays,
  compact,
}: {
  row: LeaderboardRow;
  totalDays: number;
  compact?: boolean;
}) {
  const league = leagueForDays(row.daysCompleted, totalDays);
  return (
    <div
      className={cn(
        "grid w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-2",
        compact ? "px-3 py-2.5" : "px-3 py-3 sm:px-4",
        row.isYou && "bg-gold/15"
      )}
    >
      <div className="flex justify-center">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
            row.rank === 1
              ? "bg-gradient-to-br from-gold/70 to-[#ffe082]/50 text-krishna"
              : row.rank === 2
                ? "bg-gradient-to-br from-krishna/30 to-peacock/25 text-krishna"
                : row.rank === 3
                  ? "bg-gradient-to-br from-lotus/80 to-[#ffd6dc]/60 text-krishna"
                  : "bg-cream text-[var(--text-muted)]"
          )}
          title={`Rank ${row.rank}`}
        >
          {rankBadge(row.rank)}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-sm",
            avatarTone(row.rank)
          )}
        >
          {initials(row.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-krishna">
            {row.name}
            {row.isYou && (
              <span className="ml-1.5 inline-block rounded-full bg-krishna px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wide text-white">
                You
              </span>
            )}
          </p>
          <p className="mt-0.5">
            <span
              className={cn(
                "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                league.className
              )}
            >
              {league.name}
            </span>
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-serif text-base font-bold tabular-nums leading-none text-peacock">
          {row.daysCompleted}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          / {totalDays} days
        </p>
      </div>
    </div>
  );
}

function topRankPodiumRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  return rows.filter((r) => r.rank >= 1 && r.rank <= 3);
}

/**
 * Desktop podium: one column per rank (2 | 1 | 3).
 * Multiple ties stack inside that column so positions stay fixed.
 */
function DesktopPodium({
  rank1,
  rank2,
  rank3,
  totalDays,
}: {
  rank1: LeaderboardRow[];
  rank2: LeaderboardRow[];
  rank3: LeaderboardRow[];
  totalDays: number;
}) {
  const columns: { rank: number; rows: LeaderboardRow[]; order: string }[] = [
    { rank: 2, rows: rank2, order: "order-1" },
    { rank: 1, rows: rank1, order: "order-2" },
    { rank: 3, rows: rank3, order: "order-3" },
  ];

  return (
    <div className="hidden grid-cols-3 items-end gap-2 px-3 pb-0 pt-2 sm:grid sm:gap-4 sm:px-5">
      {columns.map(({ rank, rows, order }) => (
        <div
          key={rank}
          className={cn(
            "flex min-w-0 flex-col items-center justify-end gap-3",
            order
          )}
        >
          {rows.length === 0 ? (
            <div className="w-full opacity-0" aria-hidden>
              <div className="h-14" />
            </div>
          ) : (
            rows.map((row) => (
              <PodiumCard
                key={row.participantId}
                row={row}
                totalDays={totalDays}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function ChallengeLeaderboard({
  challenge,
  user,
  nowMs,
}: {
  challenge: SavedChallenge;
  user: LocalUserProfile | null;
  nowMs: number;
}) {
  const rows = useMemo(
    () => getChallengeLeaderboardRows(challenge, user, nowMs),
    [challenge, user, nowMs]
  );
  const podiumRows = useMemo(() => topRankPodiumRows(rows), [rows]);
  const rank1 = podiumRows.filter((r) => r.rank === 1);
  const rank2 = podiumRows.filter((r) => r.rank === 2);
  const rank3 = podiumRows.filter((r) => r.rank === 3);
  const myRow = rows.find((r) => r.isYou) ?? null;
  const mine = findMyParticipant(challenge, user);
  const isCreator =
    user &&
    challenge.createdBy.trim().toLowerCase() ===
      user.fullName.trim().toLowerCase();

  return (
    <GlassCard
      strong
      padding="p-0"
      lift={false}
      className="w-full max-w-full overflow-hidden"
    >
      {/* Header — stacked on mobile so nothing floats off-screen */}
      <div className="border-b border-gold/30 px-3 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-saffron shadow-md sm:h-10 sm:w-10">
            <Trophy className="h-4 w-4 text-krishna" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-serif text-base font-bold leading-snug text-krishna sm:text-xl">
              {challenge.type === "shloka" ? "📜 " : "🎨 "}
              {challenge.name}
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)] sm:text-xs">
              {challenge.days} days · by {challenge.createdBy}
              {challenge.createdAt
                ? ` · ${formatChallengeDate(challenge.createdAt)}`
                : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-peacock/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-peacock">
                <Globe className="h-3 w-3" />
                Public
              </span>
              {isCreator && (
                <span className="rounded-full bg-krishna/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-krishna">
                  Created by you
                </span>
              )}
              {mine && !isCreator && (
                <span className="rounded-full bg-tulasi/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-tulasi">
                  Joined
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                <Users className="h-3 w-3" />
                {rows.length} devotee{rows.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={challengePath(challenge.id)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-peacock/25 bg-peacock/5 py-2.5 text-xs font-semibold text-peacock transition active:bg-peacock/10 sm:mt-3 sm:w-auto sm:justify-start sm:border-0 sm:bg-transparent sm:py-0 sm:text-sm sm:hover:underline"
        >
          Open challenge
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          No devotees have joined this challenge yet.
        </p>
      ) : (
        <>
          {/* Top devotees */}
          {podiumRows.length > 0 && (
            <div className="border-b border-gold/20 bg-gradient-to-b from-cream/80 to-white">
              <p className="px-3 pt-4 text-center text-[10px] font-semibold uppercase tracking-widest text-peacock sm:px-4">
                Top devotees
              </p>
              <p className="mb-2 px-3 text-center text-[10px] text-[var(--text-muted)] sm:mb-1 sm:px-4">
                Same days completed = same rank
              </p>

              {/* Mobile: compact 3-column podium */}
              <MobilePodium
                rank1={rank1}
                rank2={rank2}
                rank3={rank3}
                totalDays={challenge.days}
              />

              {/* Desktop: fixed 3-column podium */}
              <DesktopPodium
                rank1={rank1}
                rank2={rank2}
                rank3={rank3}
                totalDays={challenge.days}
              />
            </div>
          )}

          {/* Full rankings — same grid layout on all breakpoints */}
          <div>
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-2 border-b border-gold/25 bg-cream/60 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-krishna sm:px-4 sm:text-xs">
              <span className="text-center">Rank</span>
              <span>Name</span>
              <span className="text-right">Days</span>
            </div>
            <div className="divide-y divide-gold/15">
              {rows.map((row) => (
                <RankListItem
                  key={row.participantId}
                  row={row}
                  totalDays={challenge.days}
                />
              ))}
            </div>
          </div>

          {myRow && myRow.rank > 3 && (
            <div className="border-t border-gold/30 bg-gold/10">
              <p className="px-3 pt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-peacock sm:px-4">
                Your standing
              </p>
              <RankListItem row={myRow} totalDays={challenge.days} />
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [challenges, setChallenges] = useState<SavedChallenge[]>([]);
  const [ready, setReady] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);
    const profile = guest ? null : getLoggedInUserProfile();
    setUser(profile);

    const list = loadChallengesWithDemo();
    saveChallenges(list);
    setChallenges(list);
    setReady(true);

    if (!guest) {
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
              try {
                localStorage.setItem("bhakti-user", JSON.stringify(data.user));
              } catch {
                /* ignore */
              }
            }
          }
        )
        .catch(() => {
          /* offline */
        });
    }
  }, []);

  const myPublic = useMemo(
    () => getMyPublicChallenges(challenges, user),
    [challenges, user]
  );

  useEffect(() => {
    if (myPublic.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) =>
      prev && myPublic.some((c) => c.id === prev) ? prev : myPublic[0].id
    );
  }, [myPublic]);

  const active = myPublic.find((c) => c.id === activeId) ?? myPublic[0] ?? null;

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Leaderboard"
        subtitle="Public challenges you created or joined — ranked by days completed."
        emoji="🏆"
      />

      {isGuest || !user ? (
        <GlassCard strong padding="p-5 sm:p-6" lift={false} className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-peacock" />
          <h2 className="mt-3 font-serif text-lg font-bold text-krishna">
            Log in to see your leaderboards
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Rankings appear for public challenges you create or join.
          </p>
          <Link
            href="/please-login?reason=leaderboard&next=/leaderboard"
            className="mt-5 inline-block w-full sm:w-auto"
          >
            <Button variant="primary" fullWidth className="sm:w-auto">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </GlassCard>
      ) : myPublic.length === 0 ? (
        <GlassCard strong padding="p-5 sm:p-6" lift={false} className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-gold" />
          <h2 className="mt-3 font-serif text-lg font-bold text-krishna">
            No public challenges yet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Create a public challenge or join one — then devotee ranks will show
            here.
          </p>
          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Link href="/challenges" className="w-full sm:w-auto">
              <Button variant="gold" fullWidth className="sm:w-auto">
                Browse challenges
              </Button>
            </Link>
            <Link href="/challenges/custom" className="w-full sm:w-auto">
              <Button variant="primary" fullWidth className="sm:w-auto">
                Create public challenge
              </Button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="w-full space-y-4 sm:space-y-5">
          {/* Challenge selector — snap-scroll chips */}
          <div className="w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Your public challenges
            </p>
            <div
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Public challenges"
            >
              {myPublic.map((c) => {
                const selected = c.id === active?.id;
                const count = getChallengeLeaderboardRows(c, user, nowMs).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-[min(11rem,70vw)] shrink-0 snap-start rounded-xl border px-3 py-2.5 text-left transition",
                      selected
                        ? "border-krishna/50 bg-gradient-to-r from-krishna to-peacock text-white shadow-md"
                        : "border-gold/40 bg-white text-[var(--text-muted)] active:border-krishna/30"
                    )}
                  >
                    <p
                      className={cn(
                        "truncate text-xs font-semibold sm:text-sm",
                        selected ? "text-white" : "text-krishna"
                      )}
                    >
                      {c.name}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 flex items-center gap-1 text-[10px] font-medium",
                        selected ? "text-white/80" : "text-[var(--text-muted)]"
                      )}
                    >
                      <Users className="h-3 w-3 shrink-0" />
                      {count} · {c.days}d
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {active && (
            <ChallengeLeaderboard
              challenge={active}
              user={user}
              nowMs={nowMs}
            />
          )}

          <p className="px-1 text-center text-[10px] leading-relaxed text-[var(--text-muted)] sm:text-xs">
            Leagues: Sahadev → Nakul → Arjuna → Bhima → Yuddhistir
          </p>
        </div>
      )}
    </div>
  );
}
