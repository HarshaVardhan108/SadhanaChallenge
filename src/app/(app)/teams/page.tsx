"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { teams } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default function TeamsPage() {
  const maxPts = Math.max(...teams.map((t) => t.points));

  return (
    <div>
      <PageHeader
        title="Team Challenges"
        subtitle="Unite as Team Radha, Govinda, Gauranga, and more."
        emoji="👥"
        action={<Button variant="gold">Create Team</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["Weekly", "Monthly", "Lifetime"].map((p) => (
          <span
            key={p}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              p === "Weekly"
                ? "bg-krishna text-white"
                : "glass text-[var(--text-muted)]"
            }`}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {[...teams]
          .sort((a, b) => b.points - a.points)
          .map((t, i) => (
            <GlassCard key={t.name} gold={i === 0} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/30 font-serif text-xl font-bold text-krishna">
                #{i + 1}
              </span>
              <span className="text-4xl">{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-xl font-bold text-krishna">{t.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {t.members} devotees · {formatNumber(t.points)} Lotus Points
                </p>
                <ProgressBar
                  value={(t.points / maxPts) * 100}
                  className="mt-2"
                  showLabel={false}
                />
              </div>
              <Button variant={i === 0 ? "gold" : "outline"} size="sm">
                Join
              </Button>
            </GlassCard>
          ))}
      </div>
    </div>
  );
}
