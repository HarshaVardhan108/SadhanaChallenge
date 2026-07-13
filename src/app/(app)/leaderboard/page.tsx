"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { leaderboard } from "@/lib/data";
import { cn, formatNumber } from "@/lib/utils";
import { Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const tabs = [
  { id: "Daily", label: "Daily" },
  { id: "Weekly", label: "Weekly" },
  { id: "Monthly", label: "Monthly" },
  { id: "Temple", label: "Temple-wise" },
  { id: "Country", label: "Country-wise" },
  { id: "Friends", label: "Friends" },
  { id: "Global", label: "Global" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<TabId>("Weekly");
  const tabLabel = tabs.find((t) => t.id === tab)?.label ?? tab;
  const rows = leaderboard; // all zeros for new user

  return (
    <div>
      <PageHeader
        title="Leaderboards"
        subtitle="Start a challenge to earn Lotus Points and rise in the ranks."
        emoji="🏆"
      />

      <GlassCard gold lift={false} className="mb-6 overflow-hidden text-center sm:mb-8">
        <div className="relative mx-auto flex max-w-md flex-col items-center py-2">
          <motion.div
            className="relative"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-6xl">🏆</span>
          </motion.div>
          <p className="relative mt-3 font-serif text-xl font-bold text-krishna md:text-2xl">
            Lotus Points Glory
          </p>
          <p className="relative mt-1 flex items-center gap-1 text-sm text-peacock">
            <Sparkles className="h-3.5 w-3.5" />
            {tabLabel} · Your score starts at 0
          </p>
        </div>
      </GlassCard>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Leaderboard scope"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-10 rounded-full px-4 py-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-gradient-to-r from-krishna to-peacock text-white shadow-md"
                : "border border-gold/40 bg-white text-[var(--text-muted)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <GlassCard strong padding="p-0" lift={false}>
        <div className="flex items-center gap-2 border-b border-gold/30 px-4 py-4 sm:px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-saffron shadow-md">
            <Trophy className="h-4 w-4 text-krishna" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-bold text-krishna">
              {tabLabel} Rankings
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Fresh start · 0 Lotus Points
            </p>
          </div>
        </div>
        <ul>
          {rows.map((u) => (
            <li
              key={u.rank}
              className={cn(
                "flex items-center gap-4 border-b border-gold/15 px-4 py-3.5 last:border-0 sm:px-5",
                u.isYou && "bg-gold/15"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm font-bold text-[var(--text-muted)]">
                {u.rank}
              </span>
              <span className="text-2xl">{u.avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-krishna">
                  {u.name}
                  {u.isYou && (
                    <span className="ml-2 text-xs text-peacock">(You)</span>
                  )}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">{u.temple}</p>
              </div>
              <div className="text-right">
                <span className="font-serif font-bold text-peacock">
                  {formatNumber(u.points)}
                </span>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  Lotus Pts
                </p>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard className="mt-4 text-center" padding="p-4" lift={false}>
        <p className="text-sm text-[var(--text-muted)]">
          Complete challenges and sadhana to climb the leaderboard.
        </p>
        <Link href="/challenges" className="mt-3 inline-block">
          <Button variant="gold" size="sm">
            Start a Challenge
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}
