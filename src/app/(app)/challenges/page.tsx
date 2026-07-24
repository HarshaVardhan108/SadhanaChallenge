"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { challenges } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  loadChallengesFromServer,
  challengeProgress,
  formatChallengeDate,
  challengePath,
  findMyParticipant,
  getLoggedInUserProfile,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import {
  BookOpen,
  Palette,
  Plus,
  Users,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";

function ChallengeListCard({
  challenge,
  user,
}: {
  challenge: SavedChallenge;
  user: LocalUserProfile | null;
}) {
  const prog = challengeProgress(challenge);
  const acceptedCount = challenge.participants.filter((p) => p.accepted).length;
  const isPublic = challenge.visibility === "public";
  const mine = findMyParticipant(challenge, user);
  const href = challengePath(challenge.id);

  return (
    <Link href={href} className="block">
      <GlassCard
        strong
        className="flex flex-col transition hover:border-krishna/45 active:scale-[0.99]"
        padding="p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-bold leading-snug text-krishna">
                {challenge.type === "shloka" ? "📜 " : "🎨 "}
                {challenge.name}
              </h3>
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
              {mine && (
                <span className="rounded-full bg-krishna px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  Joined
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {challenge.days} days · by {challenge.createdBy}
              {challenge.createdAt
                ? ` · ${formatChallengeDate(challenge.createdAt)}`
                : ""}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              ID: {challenge.id}
            </p>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-peacock" />
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
              {acceptedCount} joined
            </span>
            <span className="font-bold tabular-nums text-krishna">
              {prog.pct}%
            </span>
          </div>
          <ProgressBar value={prog.pct} showLabel={false} height="h-2" />
        </div>

        <p className="mt-3 text-xs font-semibold text-peacock">
          Open challenge →
        </p>
      </GlassCard>
    </Link>
  );
}

export default function ChallengesPage() {
  const [saved, setSaved] = useState<SavedChallenge[]>([]);
  const [user, setUser] = useState<LocalUserProfile | null>(null);

  useEffect(() => {
    setUser(getLoggedInUserProfile());
    void loadChallengesFromServer().then(setSaved);

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            user?: LocalUserProfile & { fullName?: string };
          } | null
        ) => {
          if (data?.user?.fullName) {
            setUser({
              id: data.user.id,
              fullName: data.user.fullName,
              email: data.user.email,
            });
            try {
              localStorage.setItem("bhakti-user", JSON.stringify(data.user));
            } catch {
              /* ignore */
            }
            void loadChallengesFromServer().then(setSaved);
          }
        }
      )
      .catch(() => {
        /* offline */
      });
  }, []);

  const publicChallenges = useMemo(
    () => saved.filter((c) => c.visibility === "public"),
    [saved]
  );

  const privateChallenges = useMemo(
    () => saved.filter((c) => c.visibility === "private"),
    [saved]
  );

  return (
    <div>
      <PageHeader
        title="Challenges"
        subtitle="Create a path, then open any challenge by its id to view progress."
        emoji="✨"
      />

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {challenges.map((c) => {
          const isShloka = c.id === "shloka";
          return (
            <GlassCard key={c.id} className="flex flex-col" strong>
              <div
                className={cn(
                  "mb-4 h-2 w-full rounded-full bg-gradient-to-r",
                  c.color
                )}
              />
              <div className="mb-2 flex items-center gap-2">
                {isShloka ? (
                  <BookOpen className="h-5 w-5 text-krishna" />
                ) : (
                  <Palette className="h-5 w-5 text-krishna" />
                )}
                <h2 className="font-serif text-xl font-bold text-krishna sm:text-2xl">
                  {c.title}
                </h2>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{c.subtitle}</p>
              <p className="mt-2 text-xs font-medium text-peacock">
                Badge: {c.badge}
              </p>
              <Link href={`/challenges/${c.id}`} className="mt-5 block">
                <Button
                  variant={isShloka ? "gold" : "primary"}
                  fullWidth
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  {c.cta}
                </Button>
              </Link>
            </GlassCard>
          );
        })}
      </div>

      <section className="mt-8 sm:mt-10">
        <div className="mb-2 flex items-center gap-2 sm:mb-3">
          <Globe className="h-5 w-5 text-peacock" />
          <h2 className="font-serif text-lg font-bold text-krishna sm:text-xl">
            Public Challenges
          </h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
          Tap a challenge to open its page (unique id). Track your days there —
          not on this list.
        </p>

        {publicChallenges.length === 0 ? (
          <GlassCard padding="p-5" lift={false}>
            <p className="text-sm text-[var(--text-muted)]">
              No public challenges yet. Create a{" "}
              <Link
                href="/challenges/custom"
                className="font-semibold text-krishna hover:underline"
              >
                Custom
              </Link>{" "}
              or{" "}
              <Link
                href="/challenges/shloka"
                className="font-semibold text-krishna hover:underline"
              >
                Shloka
              </Link>{" "}
              challenge with <strong>public</strong> visibility.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {publicChallenges.map((c) => (
              <ChallengeListCard key={c.id} challenge={c} user={user} />
            ))}
          </div>
        )}
      </section>

      {privateChallenges.length > 0 && (
        <section className="mt-8 sm:mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Lock className="h-5 w-5 text-krishna" />
            <h2 className="font-serif text-lg font-bold text-krishna sm:text-xl">
              Your private challenges
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4">
            {privateChallenges.map((c) => (
              <ChallengeListCard key={c.id} challenge={c} user={user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
