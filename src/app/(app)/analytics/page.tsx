"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const weekRounds = [0, 0, 0, 0, 0, 0, 0];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmap = Array.from({ length: 84 }, () => 0);

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Your sadhana insights start empty — practice to fill the charts."
        emoji="📊"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Daily rounds (avg)", value: "0", icon: "🕉️" },
          { label: "Reading hours", value: "0 h", icon: "📖" },
          { label: "Books completed", value: "0", icon: "📚" },
          { label: "Shlokas learned", value: "0", icon: "📜" },
          { label: "Meditation (min)", value: "0", icon: "🧘" },
          { label: "Temple attendance", value: "0", icon: "🛕" },
          { label: "Consistency", value: "0%", icon: "✨" },
          { label: "Lotus Points", value: "0", icon: "🪷" },
        ].map((s) => (
          <GlassCard key={s.label} padding="p-3 sm:p-4" lift={false}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">{s.label}</p>
              <span>{s.icon}</span>
            </div>
            <p className="mt-1 font-serif text-xl font-bold text-krishna sm:text-2xl">
              {s.value}
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mb-6 sm:mb-8" lift={false}>
        <h2 className="font-serif text-lg font-bold text-krishna">This Week&apos;s Rounds</h2>
        <div className="mt-6 flex h-40 items-end justify-between gap-2 sm:h-48">
          {weekRounds.map((v, i) => (
            <div key={days[i]} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-peacock">{v}</span>
              <div
                className="w-full max-w-[48px] rounded-t-xl bg-cream border border-gold/30"
                style={{ height: v === 0 ? "8%" : `${(v / 16) * 100}%` }}
              />
              <span className="text-xs text-[var(--text-muted)]">{days[i]}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard lift={false}>
        <h2 className="font-serif text-lg font-bold text-krishna">Consistency Heatmap</h2>
        <p className="text-xs text-[var(--text-muted)]">Last 12 weeks — no activity yet</p>
        <div className="mt-4 flex flex-wrap gap-1">
          {heatmap.map((_, i) => (
            <div
              key={i}
              className="h-3.5 w-3.5 rounded-sm bg-cream border border-gold/20"
              title="No activity"
            />
          ))}
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <GlassCard lift={false}>
          <h3 className="font-medium text-krishna">Reading progress</h3>
          <ProgressBar value={0} className="mt-3" />
        </GlassCard>
        <GlassCard lift={false}>
          <h3 className="font-medium text-krishna">Shloka mastery</h3>
          <ProgressBar value={0} className="mt-3" color="#FFC0CB" />
        </GlassCard>
      </div>

      <div className="mt-6 text-center">
        <Link href="/challenges">
          <Button variant="gold">Start earning stats</Button>
        </Link>
      </div>
    </div>
  );
}
