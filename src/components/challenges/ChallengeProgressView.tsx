"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  assignTiedRanks,
  canToggleChallengeDay,
  challengeProgress,
  getDayStatus,
  participantCompletedCount,
  participantMissedCount,
  type ChallengeDayStatus,
  type ChallengeParticipant,
  type SavedChallenge,
} from "@/lib/challenges";
import {
  Check,
  ChevronDown,
  Flame,
  Lock,
  Trophy,
  Users,
  X,
} from "lucide-react";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarTone(index: number): string {
  const tones = [
    "from-krishna to-peacock",
    "from-peacock to-tulasi",
    "from-saffron to-gold",
    "from-lotus to-saffron",
    "from-indigo to-krishna",
  ];
  return tones[index % tones.length];
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function statusLabel(status: ChallengeDayStatus): string {
  switch (status) {
    case "completed":
      return "Done";
    case "missed":
      return "Missed";
    case "active":
      return "Today — mark within 24h";
    case "upcoming":
      return "Upcoming";
  }
}

function dayCellClass(status: ChallengeDayStatus): string {
  switch (status) {
    case "completed":
      return "border-tulasi bg-tulasi text-white shadow-sm";
    case "missed":
      return "border-red-500/70 bg-red-50 text-red-600";
    case "active":
      return "border-krishna bg-white text-krishna ring-2 ring-krishna/25";
    case "upcoming":
      return "border-gold/30 bg-cream/60 text-[var(--text-muted)] opacity-70";
  }
}

function DayStatusIcon({
  status,
  dayNumber,
  size = "sm",
}: {
  status: ChallengeDayStatus;
  dayNumber: number;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-3.5 w-3.5";
  if (status === "completed") {
    return <Check className={iconClass} strokeWidth={3} />;
  }
  if (status === "missed") {
    return <X className={iconClass} strokeWidth={3} />;
  }
  return <span>{dayNumber}</span>;
}

/** Longest consecutive completed-day run (missed/upcoming break the streak). */
function bestStreak(
  p: ChallengeParticipant,
  challenge: Pick<SavedChallenge, "createdAt" | "days">,
  nowMs: number
): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < challenge.days; i++) {
    const status = getDayStatus(
      challenge.createdAt,
      i,
      Boolean(p.completedDays[i]),
      nowMs
    );
    if (status === "completed") {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

type SortedParticipant = ChallengeParticipant & {
  done: number;
  missed: number;
  pct: number;
  rank: number;
  streak: number;
  isMe: boolean;
};

function sortParticipants(
  challenge: SavedChallenge,
  myParticipantId: string | null | undefined,
  nowMs: number
): SortedParticipant[] {
  const accepted = challenge.participants.filter((p) => p.accepted);
  const sorted = accepted
    .map((p) => {
      const done = participantCompletedCount(p, challenge, nowMs);
      const missed = participantMissedCount(p, challenge, nowMs);
      return {
        ...p,
        done,
        missed,
        pct: Math.round((done / Math.max(1, challenge.days)) * 100),
        streak: bestStreak(p, challenge, nowMs),
        rank: 0,
        isMe: Boolean(myParticipantId && p.id === myParticipantId),
      };
    })
    // Rank only by days completed; name is tie-break for display order only
    .sort(
      (a, b) => b.done - a.done || a.name.localeCompare(b.name)
    );

  // Same days completed → same rank (dense: 1, 1, 2, 3…)
  const ranks = assignTiedRanks(sorted.map((p) => p.done));
  const ranked = sorted.map((p, i) => ({ ...p, rank: ranks[i] }));

  // Logged-in user always pinned at top for public boards
  if (myParticipantId) {
    const mine = ranked.find((p) => p.id === myParticipantId);
    const others = ranked.filter((p) => p.id !== myParticipantId);
    if (mine) return [mine, ...others];
  }
  return ranked;
}

/** Week-chunked day cells — 24h window status (done / missed / active / upcoming). */
function DayDots({
  challenge,
  completedDays,
  interactive,
  onToggleDay,
  participantName,
  nowMs,
}: {
  challenge: SavedChallenge;
  completedDays: boolean[];
  interactive?: boolean;
  onToggleDay?: (dayIndex: number) => void;
  participantName: string;
  nowMs: number;
}) {
  const cells = Array.from({ length: challenge.days }, (_, i) => i);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      {weeks.map((week, wi) => (
        <div key={wi}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Week {wi + 1}
            <span className="ml-1 font-normal normal-case tracking-normal">
              · Days {week[0] + 1}–{week[week.length - 1] + 1}
            </span>
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map((d) => {
              const status = getDayStatus(
                challenge.createdAt,
                d,
                Boolean(completedDays[d]),
                nowMs
              );
              const canToggle =
                Boolean(interactive && onToggleDay) &&
                canToggleChallengeDay(challenge.createdAt, d, nowMs);
              const className = cn(
                "flex aspect-square min-h-9 w-full flex-col items-center justify-center rounded-lg border-2 text-[10px] font-semibold transition sm:min-h-10",
                dayCellClass(status),
                canToggle && "active:scale-95 cursor-pointer",
                !canToggle && interactive && "cursor-default"
              );
              if (canToggle && onToggleDay) {
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onToggleDay(d)}
                    aria-label={`${participantName} day ${d + 1}: ${statusLabel(status)}`}
                    aria-pressed={status === "completed"}
                    className={className}
                  >
                    <DayStatusIcon status={status} dayNumber={d + 1} />
                  </button>
                );
              }
              return (
                <div
                  key={d}
                  title={`Day ${d + 1}: ${statusLabel(status)}`}
                  aria-label={`${participantName} day ${d + 1}: ${statusLabel(status)}`}
                  className={className}
                >
                  <DayStatusIcon status={status} dayNumber={d + 1} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ParticipantCard({
  p,
  challenge,
  colorIndex,
  defaultOpen,
  interactive,
  onToggleDay,
  nowMs,
}: {
  p: SortedParticipant;
  challenge: SavedChallenge;
  colorIndex: number;
  defaultOpen?: boolean;
  interactive?: boolean;
  onToggleDay?: (dayIndex: number) => void;
  nowMs: number;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const days = challenge.days;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white/90 shadow-sm",
        p.isMe
          ? "border-krishna/50 ring-2 ring-krishna/20"
          : p.rank === 1
            ? "border-gold/60 ring-1 ring-gold/30"
            : "border-gold/30"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-3 text-left active:bg-cream/60 sm:p-3.5"
        aria-expanded={open}
      >
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow",
              p.isMe ? "from-krishna to-peacock" : avatarTone(colorIndex)
            )}
          >
            {initials(p.name)}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-cream px-1 text-[10px] font-bold text-krishna shadow-sm">
            {rankLabel(p.rank)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 font-semibold text-krishna">
                <span className="truncate">{p.name}</span>
                {p.isMe && (
                  <span className="shrink-0 rounded-full bg-krishna px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    You
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                <span className="font-medium text-peacock">
                  {p.done} of {days} days
                </span>
                {p.missed > 0 && (
                  <span className="ml-2 font-medium text-red-600">
                    · {p.missed} missed
                  </span>
                )}
                {p.streak > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-saffron">
                    <Flame className="h-3 w-3" />
                    {p.streak}d streak
                  </span>
                )}
                {p.isMe && interactive && (
                  <span className="ml-2 text-tulasi">· mark today only</span>
                )}
                {!p.isMe && (
                  <span className="ml-2 text-[var(--text-muted)]">
                    · view only
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-krishna/10 px-2 py-0.5 text-xs font-bold tabular-nums text-krishna">
                {p.pct}%
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--text-muted)] transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-0.5" aria-hidden>
            {Array.from({ length: Math.min(days, 21) }, (_, i) => {
              const status = getDayStatus(
                challenge.createdAt,
                i,
                Boolean(p.completedDays[i]),
                nowMs
              );
              return (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                    status === "completed" && "bg-tulasi",
                    status === "missed" && "bg-red-500",
                    status === "active" && "bg-krishna",
                    status === "upcoming" && "bg-gold/35"
                  )}
                />
              );
            })}
            {days > 21 && (
              <span className="ml-0.5 text-[9px] text-[var(--text-muted)]">
                +{days - 21}
              </span>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "border-t px-3 py-3 sm:px-3.5",
            p.isMe && interactive
              ? "border-krishna/20 bg-krishna/5"
              : "border-gold/25 bg-cream/40"
          )}
        >
          <p className="mb-2 text-[11px] font-medium text-[var(--text-muted)]">
            {interactive
              ? "Each day has a 24-hour window. Mark today complete before time runs out — missed days show ✕ and do not count."
              : "Day-by-day progress · view only · missed days do not count"}
            <span className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-3 w-3 items-center justify-center rounded border-2 border-tulasi bg-tulasi text-white">
                  <Check className="h-2 w-2" strokeWidth={3} />
                </span>
                Done
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-3 w-3 items-center justify-center rounded border-2 border-red-500/70 bg-red-50 text-red-600">
                  <X className="h-2 w-2" strokeWidth={3} />
                </span>
                Missed
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border-2 border-krishna bg-white" />
                Today
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border-2 border-gold/30 bg-cream/60 opacity-70" />
                Upcoming
              </span>
            </span>
          </p>
          <DayDots
            challenge={challenge}
            completedDays={p.completedDays}
            interactive={interactive}
            onToggleDay={onToggleDay}
            participantName={p.name}
            nowMs={nowMs}
          />
        </div>
      )}
    </div>
  );
}

/** Desktop table — hidden on small screens */
function DesktopDayTable({
  challenge,
  sorted,
  editableParticipantId,
  onToggle,
  nowMs,
}: {
  challenge: SavedChallenge;
  sorted: SortedParticipant[];
  editableParticipantId?: string | null;
  onToggle?: (participantId: string, dayIndex: number) => void;
  nowMs: number;
}) {
  const dayCols = Array.from({ length: challenge.days }, (_, i) => i);

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-gold/30 bg-cream/50 md:block">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-gold/30 bg-white/80">
            <th className="sticky left-0 z-10 bg-white/95 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-krishna">
              Rank
            </th>
            <th className="sticky left-12 z-10 bg-white/95 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-krishna">
              Devotee
            </th>
            {dayCols.map((d) => (
              <th
                key={d}
                className="min-w-10 px-1.5 py-2.5 text-center text-[10px] font-semibold text-peacock sm:min-w-11 sm:text-xs"
              >
                D{d + 1}
              </th>
            ))}
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-krishna">
              Done
            </th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-red-600">
              Missed
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, rowIdx) => {
            const isOwner =
              Boolean(onToggle) &&
              Boolean(editableParticipantId) &&
              p.id === editableParticipantId;
            return (
              <tr
                key={p.id}
                className={cn(
                  "border-b border-gold/15 last:border-0",
                  p.isMe
                    ? "bg-krishna/8"
                    : rowIdx % 2 === 0
                      ? "bg-white/40"
                      : "bg-cream/40"
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-center text-sm">
                  {rankLabel(p.rank)}
                </td>
                <td className="sticky left-12 z-10 bg-inherit px-3 py-2 font-medium text-krishna">
                  <span className="flex max-w-[14rem] items-center gap-1.5 truncate">
                    {p.name}
                    {p.isMe && (
                      <span className="rounded bg-krishna px-1 text-[9px] font-bold uppercase text-white">
                        You
                      </span>
                    )}
                  </span>
                </td>
                {dayCols.map((d) => {
                  const status = getDayStatus(
                    challenge.createdAt,
                    d,
                    Boolean(p.completedDays[d]),
                    nowMs
                  );
                  const canToggle =
                    isOwner &&
                    canToggleChallengeDay(challenge.createdAt, d, nowMs);
                  const cellClass = cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-md border-2 sm:h-8 sm:w-8",
                    dayCellClass(status)
                  );
                  if (!canToggle) {
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        <span
                          title={statusLabel(status)}
                          className={cellClass}
                        >
                          <DayStatusIcon
                            status={status}
                            dayNumber={d + 1}
                            size="md"
                          />
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle?.(p.id, d)}
                        aria-label={`${p.name} day ${d + 1}: ${statusLabel(status)}`}
                        aria-pressed={status === "completed"}
                        className={cn(cellClass, "transition active:scale-95")}
                      >
                        <DayStatusIcon
                          status={status}
                          dayNumber={d + 1}
                          size="md"
                        />
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-xs font-semibold tabular-nums text-peacock">
                  {p.done}/{challenge.days}
                </td>
                <td className="px-2 py-2 text-center text-xs font-semibold tabular-nums text-red-600">
                  {p.missed}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export type ChallengeProgressViewProps = {
  challenge: SavedChallenge;
  /**
   * Called when a day is toggled. Parent must enforce ownership
   * (only current user's participant id).
   */
  onToggle?: (participantId: string, dayIndex: number) => void;
  /** Logged-in user's participant row — pinned at top; only this row is editable */
  myParticipantId?: string | null;
  /** Display name of logged-in user (shown in "Your progress" header) */
  myDisplayName?: string | null;
  defaultExpandTop?: number;
  className?: string;
  compact?: boolean;
};

/**
 * Mobile-first progress board.
 * When myParticipantId is set: that devotee is pinned first and can edit only their days.
 * All other participants are view-only.
 */
export function ChallengeProgressView({
  challenge,
  onToggle,
  myParticipantId = null,
  myDisplayName = null,
  defaultExpandTop = 1,
  className,
  compact = false,
}: ChallengeProgressViewProps) {
  // Refresh when a 24h window rolls over so missed days appear without reload.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sorted = useMemo(
    () => sortParticipants(challenge, myParticipantId, nowMs),
    [challenge, myParticipantId, nowMs]
  );
  const prog = challengeProgress(challenge, nowMs);
  const me = sorted.find((p) => p.isMe) || null;
  const canEditMine = Boolean(myParticipantId && onToggle);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No one has joined this challenge yet.
      </p>
    );
  }

  const leader = [...sorted].sort((a, b) => a.rank - b.rank)[0];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Logged-in user banner */}
      {me && (
        <div
          className={cn(
            "rounded-2xl border border-krishna/35 bg-gradient-to-r from-krishna/10 via-white to-gold/15",
            compact ? "p-3" : "p-3.5 sm:p-4"
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-peacock">
            Your progress
          </p>
          <p className="mt-0.5 font-serif text-lg font-bold text-krishna sm:text-xl">
            {myDisplayName || me.name}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Rank {rankLabel(me.rank)} · {me.done} of {challenge.days} days (
            {me.pct}%)
            {me.missed > 0 ? (
              <span className="text-red-600"> · {me.missed} missed</span>
            ) : null}
            {canEditMine
              ? " · Mark today complete within its 24-hour window"
              : ""}
          </p>
        </div>
      )}

      {/* Group summary — % shown as text; single progress bar lives on the challenge header */}
      <div
        className={cn(
          "rounded-2xl border border-gold/35 bg-gradient-to-br from-white to-cream/80",
          compact ? "p-3" : "p-3.5 sm:p-4"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-peacock">
            <Trophy className="h-3.5 w-3.5" />
            Progress leaderboard
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-krishna">
            <Users className="h-3.5 w-3.5" />
            {sorted.length} devotee{sorted.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Group completion:{" "}
          <span className="font-bold tabular-nums text-krishna">
            {prog.pct}% · {prog.completed}/{prog.total} days counted
          </span>
          {prog.missed > 0 && (
            <span className="ml-2 font-semibold tabular-nums text-red-600">
              · {prog.missed} missed (not counted)
            </span>
          )}
        </p>
        {leader && (
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            Leading:{" "}
            <span className="font-semibold text-krishna">
              {rankLabel(1)} {leader.name}
              {leader.isMe ? " (you)" : ""}
            </span>{" "}
            with {leader.done}/{challenge.days} days ({leader.pct}%)
          </p>
        )}
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-medium text-[var(--text-muted)]">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          {canEditMine
            ? "Only today’s 24h window is editable — missed days stay ✕ and never count"
            : "View only — join this challenge to track your own days"}
        </p>
      </div>

      {/* Mobile cards: me first, then others */}
      <div className="space-y-2.5 md:hidden">
        <p className="text-[11px] text-[var(--text-muted)]">
          {me
            ? "Your card is first. Expand it to mark today before the 24h window ends. Other devotees are view-only."
            : "Tap a devotee to view their day-by-day progress (read-only)."}
        </p>
        {sorted.map((p, i) => {
          const canEdit = canEditMine && p.isMe;
          return (
            <ParticipantCard
              key={p.id}
              p={p}
              challenge={challenge}
              colorIndex={i}
              defaultOpen={p.isMe || i < defaultExpandTop}
              interactive={canEdit}
              nowMs={nowMs}
              onToggleDay={
                canEdit && onToggle
                  ? (dayIndex) => onToggle(p.id, dayIndex)
                  : undefined
              }
            />
          );
        })}
      </div>

      <DesktopDayTable
        challenge={challenge}
        sorted={sorted}
        editableParticipantId={canEditMine ? myParticipantId : null}
        onToggle={canEditMine ? onToggle : undefined}
        nowMs={nowMs}
      />
    </div>
  );
}
