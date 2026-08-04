"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChallengeProgressView } from "@/components/challenges/ChallengeProgressView";
import { ShareChallengeLink } from "@/components/challenges/ShareChallengeLink";
import {
  challengePath,
  CHALLENGE_STATIC_SEGMENTS,
  findMyParticipant,
  formatChallengeDate,
  getChallengeById,
  getLoggedInUserProfile,
  getParticipantActiveDayAction,
  joinChallengeAsUser,
  loadChallengesFromServer,
  markOwnActiveDayComplete,
  toggleOwnParticipantDay,
  toggleParticipantDay,
  challengeProgress,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import { isGuestUser } from "@/lib/guest";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Globe,
  Lock,
  LogIn,
  Users,
  UserPlus,
} from "lucide-react";

function ChallengeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const id = decodeURIComponent(rawId);
  const showShareHighlight =
    searchParams.get("share") === "1" || searchParams.get("created") === "1";

  const [challenge, setChallenge] = useState<SavedChallenge | null>(null);
  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [missing, setMissing] = useState(false);

  const reload = useCallback(() => {
    if (!id || CHALLENGE_STATIC_SEGMENTS.has(id)) {
      setMissing(true);
      return;
    }
    void loadChallengesFromServer().then((list) => {
      const found = list.find((c) => c.id === id) ?? getChallengeById(id);
      if (!found) {
        setChallenge(null);
        setMissing(true);
        return;
      }
      setMissing(false);
      setChallenge(found);
    });
  }, [id]);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);
    setUser(guest ? null : getLoggedInUserProfile());
    reload();

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
  }, [reload]);

  const handleToggle = useCallback(
    (participantId: string, dayIndex: number) => {
      if (!challenge) return;
      const profile = getLoggedInUserProfile();
      if (challenge.visibility === "public") {
        const next = toggleOwnParticipantDay(
          challenge.id,
          participantId,
          dayIndex,
          profile
        );
        const updated = next.find((c) => c.id === challenge.id) ?? null;
        setChallenge(updated);
        return;
      }
      const next = toggleParticipantDay(challenge.id, participantId, dayIndex);
      setChallenge(next.find((c) => c.id === challenge.id) ?? null);
    },
    [challenge]
  );

  const handleJoin = useCallback(() => {
    if (!challenge) return;
    const profile = getLoggedInUserProfile();
    if (!profile) {
      router.push(
        `/please-login?reason=join&next=${encodeURIComponent(challengePath(challenge.id))}`
      );
      return;
    }
    const next = joinChallengeAsUser(challenge.id, profile);
    setChallenge(next.find((c) => c.id === challenge.id) ?? null);
  }, [challenge, router]);

  const handleMarkComplete = useCallback(() => {
    if (!challenge) return;
    const profile = getLoggedInUserProfile();
    if (!profile) return;
    const next = markOwnActiveDayComplete(challenge.id, profile);
    setChallenge(next.find((c) => c.id === challenge.id) ?? null);
  }, [challenge]);

  if (missing) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <GlassCard padding="p-6" strong>
          <p className="text-4xl" aria-hidden>
            🪷
          </p>
          <h1 className="mt-3 font-serif text-xl font-bold text-krishna">
            Challenge not found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            This challenge id is missing or was removed.
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            id: {id || "—"}
          </p>
          <Link href="/dashboard" className="mt-5 block">
            <Button variant="primary" fullWidth>
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        Loading challenge…
      </div>
    );
  }

  const prog = challengeProgress(challenge);
  const isPublic = challenge.visibility === "public";
  const mine = findMyParticipant(challenge, user);
  const acceptedCount = challenge.participants.filter((p) => p.accepted).length;
  const myParticipantId = mine?.id ?? null;
  const dayAction =
    challenge.type === "shloka" && user && mine
      ? getParticipantActiveDayAction(challenge, user)
      : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gold/40 bg-white px-3 text-sm font-medium text-krishna transition active:bg-cream"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-peacock hover:underline sm:text-sm"
        >
          Dashboard
        </Link>
        <span className="text-xs text-[var(--text-muted)]">/</span>
        <span className="max-w-[12rem] truncate text-xs font-medium text-krishna sm:max-w-none sm:text-sm">
          {challenge.name}
        </span>
      </div>

      <GlassCard strong padding="p-4 sm:p-6" lift={false}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold leading-snug text-krishna sm:text-3xl">
                {challenge.type === "shloka" ? "📜 " : "🎨 "}
                {challenge.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isPublic
                    ? "bg-peacock/10 text-peacock"
                    : "bg-krishna/10 text-krishna"
                )}
              >
                {isPublic ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
              {challenge.days} days · by {challenge.createdBy}
              {challenge.createdAt
                ? ` · ${formatChallengeDate(challenge.createdAt)}`
                : ""}
            </p>
            <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)] sm:text-xs">
              Challenge ID: {challenge.id}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 rounded-xl border border-gold/30 bg-cream/70 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-xs font-medium text-krishna">
              <Users className="h-3.5 w-3.5" />
              {acceptedCount} joined
            </p>
            <p className="text-sm font-bold tabular-nums text-peacock">
              {prog.pct}% group
            </p>
          </div>
        </div>

        {challenge.goal && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)] sm:text-base">
            {challenge.goal}
          </p>
        )}

        {(challenge.activityLabels?.length || challenge.shlokas?.length) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(challenge.shlokas?.length
              ? challenge.shlokas
              : challenge.activityLabels || []
            ).map((label) => (
              <span
                key={label}
                className="rounded-full border border-peacock/20 bg-peacock/5 px-2.5 py-0.5 text-[11px] font-medium text-peacock"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Group progress</span>
            <span className="font-bold tabular-nums text-krishna">
              {prog.pct}%
            </span>
          </div>
          <ProgressBar value={prog.pct} showLabel={false} height="h-2.5" />
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {isGuest ? (
            <Link
              href={`/please-login?reason=join&next=${encodeURIComponent(challengePath(challenge.id))}`}
              className="flex-1"
            >
              <Button variant="gold" fullWidth>
                <LogIn className="h-4 w-4" />
                Login to Join
              </Button>
            </Link>
          ) : isPublic && user && !mine ? (
            <Button variant="primary" fullWidth onClick={handleJoin}>
              <UserPlus className="h-4 w-4" />
              Join as {user.fullName}
            </Button>
          ) : null}
        </div>

        {isPublic && (
          <ShareChallengeLink
            challengeId={challenge.id}
            challengeName={challenge.name}
            emphasize={showShareHighlight}
            className="mt-4"
          />
        )}

        {/* Shloka: Mark as complete for active day when joined */}
        {dayAction && dayAction.phase === "active" && (
          <div className="mt-4 rounded-xl border border-gold/35 bg-cream/50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-peacock">
              Today · Day {dayAction.dayNumber} of {challenge.days}
            </p>
            {dayAction.canMarkComplete ? (
              <Button
                type="button"
                variant="primary"
                fullWidth
                className="mt-2"
                onClick={handleMarkComplete}
              >
                <Check className="h-4 w-4" />
                Mark as complete
              </Button>
            ) : dayAction.isComplete ? (
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-tulasi/30 bg-tulasi/10 py-2.5 text-sm font-semibold text-tulasi">
                <Check className="h-4 w-4" />
                Day {dayAction.dayNumber} marked complete
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
                This day&apos;s 24-hour window is not open for marking.
              </p>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="p-3.5 sm:p-5" lift={false}>
        <ChallengeProgressView
          challenge={challenge}
          myParticipantId={myParticipantId}
          myDisplayName={user?.fullName ?? null}
          onToggle={
            isGuest
              ? undefined
              : myParticipantId
                ? (participantId, dayIndex) => {
                    if (isPublic && participantId !== myParticipantId) return;
                    handleToggle(participantId, dayIndex);
                  }
                : isPublic
                  ? undefined
                  : handleToggle
          }
          defaultExpandTop={1}
        />
      </GlassCard>
    </div>
  );
}

export default function ChallengeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
          Loading challenge…
        </div>
      }
    >
      <ChallengeDetailContent />
    </Suspense>
  );
}
