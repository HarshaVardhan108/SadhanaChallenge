"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  getChallengeLeaderboardRows,
  getLoggedInUserProfile,
  getMyJoinedChallenges,
  loadChallengesWithDemo,
  type LocalUserProfile,
  type SavedChallenge,
} from "@/lib/challenges";
import { isGuestUser } from "@/lib/guest";
import { cn } from "@/lib/utils";
import { LogIn } from "lucide-react";

const SHLOKAS_COMPLETED_KEY = "bhakti-shlokas-completed";

type Metric = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  color: string;
  colorSoft: string;
  emoji: string;
  href: string;
};

function loadShlokasCompletedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(SHLOKAS_COMPLETED_KEY);
    if (!raw) return 0;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return 0;
    return new Set(arr.map(String)).size;
  } catch {
    return 0;
  }
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCreatedByUser(
  challenge: SavedChallenge,
  user: LocalUserProfile
): boolean {
  const by = normalizeName(challenge.createdBy || "");
  const un = normalizeName(user.fullName || "");
  if (!by || !un) return false;
  if (by === un) return true;
  return by.split(" ")[0] === un.split(" ")[0];
}

function countInvites(
  challenges: SavedChallenge[],
  user: LocalUserProfile
): number {
  const mine = challenges.filter((c) => isCreatedByUser(c, user));
  const seen = new Set<string>();
  let count = 0;

  for (const c of mine) {
    const inviteStrings = Array.isArray(c.invites) ? c.invites : [];
    for (const inv of inviteStrings) {
      const key = normalizeName(String(inv));
      if (!key || key === normalizeName(user.fullName)) continue;
      if (seen.has(`inv:${key}`)) continue;
      seen.add(`inv:${key}`);
      count += 1;
    }

    for (const p of c.participants) {
      if (!p.accepted) continue;
      if (user.id && p.userId && p.userId === user.id) continue;
      const pn = normalizeName(p.name);
      if (!pn || pn === normalizeName(user.fullName)) continue;
      if (pn.split(" ")[0] === normalizeName(user.fullName).split(" ")[0]) {
        continue;
      }
      const key = p.userId ? `uid:${p.userId}` : `name:${pn}`;
      if (seen.has(key) || seen.has(`inv:${pn}`)) continue;
      seen.add(key);
      count += 1;
    }
  }

  return count;
}

function countFirstRanks(
  joined: SavedChallenge[],
  user: LocalUserProfile,
  nowMs: number
): number {
  let n = 0;
  for (const c of joined) {
    const rows = getChallengeLeaderboardRows(c, user, nowMs);
    const me = rows.find((r) => r.isYou);
    if (me && me.rank === 1 && (me.daysCompleted > 0 || rows.length === 1)) {
      n += 1;
    }
  }
  return n;
}

function buildMetrics(
  user: LocalUserProfile | null,
  challenges: SavedChallenge[],
  nowMs: number
): Metric[] {
  const shlokas = loadShlokasCompletedCount();
  let joined = 0;
  let firstRanks = 0;
  let invites = 0;

  if (user) {
    const myChallenges = getMyJoinedChallenges(challenges, user);
    joined = myChallenges.length;
    firstRanks = countFirstRanks(myChallenges, user, nowMs);
    invites = countInvites(challenges, user);
  }

  return [
    {
      key: "joined",
      label: "Challenges joined",
      shortLabel: "Challenges",
      value: joined,
      color: "#1a4fa3",
      colorSoft: "rgba(26, 79, 163, 0.15)",
      emoji: "✨",
      href: "/challenges",
    },
    {
      key: "first",
      label: "First ranks",
      shortLabel: "1st place",
      value: firstRanks,
      color: "#ffd54f",
      colorSoft: "rgba(255, 213, 79, 0.25)",
      emoji: "🥇",
      href: "/leaderboard",
    },
    {
      key: "shlokas",
      label: "Shlokas completed",
      shortLabel: "Shlokas",
      value: shlokas,
      color: "#ffc0cb",
      colorSoft: "rgba(255, 192, 203, 0.35)",
      emoji: "📜",
      href: "/shlokas",
    },
    {
      key: "invites",
      label: "Devotees invited",
      shortLabel: "Invited",
      value: invites,
      color: "#006d77",
      colorSoft: "rgba(0, 109, 119, 0.15)",
      emoji: "💌",
      href: "/invite",
    },
  ];
}

/** Horizontal bar chart comparing the four metrics. */
function ComparisonBarChart({ metrics }: { metrics: Metric[] }) {
  const max = Math.max(1, ...metrics.map((m) => m.value));
  const chartH = 220;
  const padL = 72;
  const padR = 36;
  const padT = 16;
  const padB = 28;
  const barH = 28;
  const gap =
    (chartH - padT - padB - barH * metrics.length) /
    Math.max(1, metrics.length - 1);
  const innerW = 320;
  const width = padL + innerW + padR;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${chartH}`}
        className="mx-auto h-auto w-full max-w-xl"
        role="img"
        aria-label="Comparison of challenges joined, first ranks, shlokas completed, and invites"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const x = padL + t * innerW;
          return (
            <g key={t}>
              <line
                x1={x}
                y1={padT - 4}
                x2={x}
                y2={chartH - padB + 4}
                stroke="rgba(26, 79, 163, 0.12)"
                strokeWidth={1}
              />
              <text
                x={x}
                y={chartH - 6}
                textAnchor="middle"
                className="fill-[var(--text-muted)]"
                style={{ fontSize: 10 }}
              >
                {Math.round(t * max)}
              </text>
            </g>
          );
        })}

        {metrics.map((m, i) => {
          const y = padT + i * (barH + gap);
          const w = (m.value / max) * innerW;
          const barW = Math.max(m.value > 0 ? 8 : 0, w);
          return (
            <g key={m.key}>
              <text
                x={padL - 10}
                y={y + barH / 2 + 4}
                textAnchor="end"
                style={{ fontSize: 11, fontWeight: 600, fill: "#1a4fa3" }}
              >
                {m.shortLabel}
              </text>
              <rect
                x={padL}
                y={y}
                width={innerW}
                height={barH}
                rx={10}
                fill={m.colorSoft}
              />
              <rect
                x={padL}
                y={y}
                width={barW}
                height={barH}
                rx={10}
                fill={m.color}
              >
                <title>
                  {m.label}: {m.value}
                </title>
              </rect>
              <text
                x={padL + barW + (barW > innerW * 0.55 ? -10 : 8)}
                y={y + barH / 2 + 4}
                textAnchor={barW > innerW * 0.55 ? "end" : "start"}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fill: barW > innerW * 0.55 ? "#fff" : "#1a4fa3",
                }}
              >
                {m.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Donut for a single metric (share of total across the four). */
function DonutChart({
  metric,
  total,
  size = 140,
}: {
  metric: Metric;
  total: number;
  size?: number;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? metric.value / total : 0;
  const dash = Math.max(0, Math.min(1, share)) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255, 213, 79, 0.25)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={metric.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg" aria-hidden>
            {metric.emoji}
          </span>
          <span className="font-serif text-2xl font-bold tabular-nums text-krishna">
            {metric.value}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-krishna sm:text-sm">
        {metric.label}
      </p>
      <p className="text-[10px] text-[var(--text-muted)]">
        {total > 0 ? `${Math.round(share * 100)}% of total` : "—"}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [ready, setReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<LocalUserProfile | null>(null);
  const [challenges, setChallenges] = useState<SavedChallenge[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const guest = isGuestUser();
    setIsGuest(guest);
    const profile = guest ? null : getLoggedInUserProfile();
    setUser(profile);
    setChallenges(loadChallengesWithDemo());
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
              setUser({
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
              });
            }
          }
        )
        .catch(() => {
          /* offline */
        });
    }
  }, []);

  const metrics = useMemo(
    () => buildMetrics(user, challenges, nowMs),
    [user, challenges, nowMs]
  );
  const total = metrics.reduce((s, m) => s + m.value, 0);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        Loading analytics…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={
          user
            ? `Graphical overview for ${user.fullName}`
            : "Graphical overview of your sadhana activity"
        }
        emoji="📊"
      />

      {(isGuest || !user) && (
        <GlassCard
          strong
          padding="p-5"
          lift={false}
          className="mb-6 text-center"
        >
          <p className="text-sm text-[var(--text-muted)]">
            Log in to load challenges, ranks, and invites. Shloka counts still
            work on this device.
          </p>
          <Link
            href="/please-login?reason=analytics&next=/analytics"
            className="mt-3 inline-block"
          >
            <Button variant="primary" size="sm">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </GlassCard>
      )}

      {/* Horizontal comparison */}
      <GlassCard padding="p-4 sm:p-6" lift={false} className="mb-4 sm:mb-5">
        <h2 className="mb-3 font-serif text-lg font-bold text-krishna">
          Analytics
        </h2>
        <ComparisonBarChart metrics={metrics} />
      </GlassCard>

      {/* Four donuts */}
      <GlassCard padding="p-4 sm:p-6" lift={false}>
        <h2 className="mb-1 text-center font-serif text-lg font-bold text-krishna">
          Share of activity
        </h2>
        <p className="mb-5 text-center text-xs text-[var(--text-muted)]">
          Each ring shows how much of your total activity this metric is
          {total > 0 ? ` (total ${total})` : ""}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
          {metrics.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className={cn(
                "rounded-2xl p-2 transition hover:bg-cream/80 active:scale-[0.98]"
              )}
            >
              <DonutChart metric={m} total={total} size={128} />
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
