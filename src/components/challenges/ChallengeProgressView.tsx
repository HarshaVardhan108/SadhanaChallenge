"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  challengeProgress,
  participantCompletedCount,
  type ChallengeParticipant,
  type SavedChallenge,
} from "@/lib/challenges";
import { Check, ChevronDown, Flame, Lock, Trophy, Users } from "lucide-react";

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

/** Longest consecutive completed-day run (for mobile streak badge). */
function bestStreak(p: ChallengeParticipant): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < p.completedDays.length; i++) {
    if (p.completedDays[i]) {
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
  pct: number;
  rank: number;
  streak: number;
  isMe: boolean;
};

function sortParticipants(
  challenge: SavedChallenge,
  myParticipantId?: string | null
): SortedParticipant[] {
  const accepted = challenge.participants.filter((p) => p.accepted);
  const ranked = accepted
    .map((p) => {
      const done = participantCompletedCount(p);
      return {
        ...p,
        done,
        pct: Math.round((done / Math.max(1, challenge.days)) * 100),
        streak: bestStreak(p),
        rank: 0,
        isMe: Boolean(myParticipantId && p.id === myParticipantId),
      };
    })
    .sort(
      (a, b) =>
        b.done - a.done || b.streak - a.streak || a.name.localeCompare(b.name)
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));

  // Logged-in user always pinned at top for public boards
  if (myParticipantId) {
    const mine = ranked.find((p) => p.id === myParticipantId);
    const others = ranked.filter((p) => p.id !== myParticipantId);
    if (mine) return [mine, ...others];
  }
  return ranked;
}

/** Week-chunked day dots — readable on narrow screens (7 columns). */
function DayDots({
  days,
  completedDays,
  interactive,
  onToggleDay,
  participantName,
}: {
  days: number;
  completedDays: boolean[];
  interactive?: boolean;
  onToggleDay?: (dayIndex: number) => void;
  participantName: string;
}) {
  const cells = Array.from({ length: days }, (_, i) => i);
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
              const checked = Boolean(completedDays[d]);
              const className = cn(
                "flex aspect-square min-h-9 w-full flex-col items-center justify-center rounded-lg border-2 text-[10px] font-semibold transition active:scale-95 sm:min-h-10",
                checked
                  ? "border-tulasi bg-tulasi text-white shadow-sm"
                  : "border-gold/40 bg-white text-[var(--text-muted)]"
              );
              if (interactive && onToggleDay) {
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onToggleDay(d)}
                    aria-label={`${participantName} day ${d + 1} ${checked ? "completed" : "incomplete"}`}
                    aria-pressed={checked}
                    className={className}
                  >
                    {checked ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <span>{d + 1}</span>
                    )}
                  </button>
                );
              }
              return (
                <div
                  key={d}
                  title={`Day ${d + 1}: ${checked ? "Done" : "Pending"}`}
                  className={className}
                >
                  {checked ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <span>{d + 1}</span>
                  )}
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
  days,
  colorIndex,
  defaultOpen,
  interactive,
  onToggleDay,
}: {
  p: SortedParticipant;
  days: number;
  colorIndex: number;
  defaultOpen?: boolean;
  interactive?: boolean;
  onToggleDay?: (dayIndex: number) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

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
                {p.streak > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-saffron">
                    <Flame className="h-3 w-3" />
                    {p.streak}d streak
                  </span>
                )}
                {p.isMe && interactive && (
                  <span className="ml-2 text-tulasi">· edit your days</span>
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
          <div className="mt-2">
            <ProgressBar value={p.pct} showLabel={false} height="h-2" />
          </div>
          <div className="mt-2 flex flex-wrap gap-0.5" aria-hidden>
            {Array.from({ length: Math.min(days, 21) }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                  p.completedDays[i] ? "bg-tulasi" : "bg-gold/35"
                )}
              />
            ))}
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
              ? "Tap a day to mark complete or incomplete"
              : "Day-by-day progress · view only"}
            <span className="mt-1 flex flex-wrap items-center gap-3 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border-2 border-tulasi bg-tulasi" />
                Done
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded border-2 border-gold/40 bg-white" />
                Pending
              </span>
            </span>
          </p>
          <DayDots
            days={days}
            completedDays={p.completedDays}
            interactive={interactive}
            onToggleDay={onToggleDay}
            participantName={p.name}
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
}: {
  challenge: SavedChallenge;
  sorted: SortedParticipant[];
  editableParticipantId?: string | null;
  onToggle?: (participantId: string, dayIndex: number) => void;
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
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, rowIdx) => {
            const canEdit =
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
                  const checked = Boolean(p.completedDays[d]);
                  if (!canEdit) {
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        <span
                          className={cn(
                            "mx-auto flex h-7 w-7 items-center justify-center rounded-md border-2",
                            checked
                              ? "border-tulasi bg-tulasi text-white"
                              : "border-gold/50 bg-white"
                          )}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    );
                  }
                  return (
                    <td key={d} className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle?.(p.id, d)}
                        aria-label={`${p.name} day ${d + 1} ${checked ? "completed" : "incomplete"}`}
                        aria-pressed={checked}
                        className={cn(
                          "mx-auto flex h-7 w-7 items-center justify-center rounded-md border-2 transition active:scale-95 sm:h-8 sm:w-8",
                          checked
                            ? "border-tulasi bg-tulasi text-white shadow-sm"
                            : "border-gold/50 bg-white hover:border-krishna/50"
                        )}
                      >
                        {checked && (
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-xs font-semibold tabular-nums text-peacock">
                  {p.done}/{challenge.days}
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
  const sorted = useMemo(
    () => sortParticipants(challenge, myParticipantId),
    [challenge, myParticipantId]
  );
  const prog = challengeProgress(challenge);
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
            {canEditMine
              ? " · Tap days below to update only your progress"
              : ""}
          </p>
          <div className="mt-2">
            <ProgressBar value={me.pct} showLabel={false} height="h-2.5" />
          </div>
        </div>
      )}

      {/* Group summary */}
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
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Group completion</span>
            <span className="font-bold tabular-nums text-krishna">
              {prog.pct}% · {prog.completed}/{prog.total} days logged
            </span>
          </div>
          <ProgressBar value={prog.pct} showLabel={false} height="h-2.5" />
        </div>
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
            ? "You can edit only your days — others are view only"
            : "View only — join this challenge to track your own days"}
        </p>
      </div>

      {/* Mobile cards: me first, then others */}
      <div className="space-y-2.5 md:hidden">
        <p className="text-[11px] text-[var(--text-muted)]">
          {me
            ? "Your card is first. Expand it to mark your days. Other devotees are view-only."
            : "Tap a devotee to view their day-by-day progress (read-only)."}
        </p>
        {sorted.map((p, i) => {
          const canEdit = canEditMine && p.isMe;
          return (
            <ParticipantCard
              key={p.id}
              p={p}
              days={challenge.days}
              colorIndex={i}
              defaultOpen={p.isMe || i < defaultExpandTop}
              interactive={canEdit}
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
      />
    </div>
  );
}
