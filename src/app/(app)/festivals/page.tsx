"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { festivals } from "@/lib/data";

export default function FestivalsPage() {
  const upcoming = festivals.filter((f) => f.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft);
  const past = festivals.filter((f) => f.daysLeft <= 0);

  return (
    <div>
      <PageHeader
        title="Festivals"
        subtitle="Sacred calendar with countdowns and special challenges."
        emoji="🎉"
      />

      <h2 className="mb-4 font-serif text-xl font-bold text-krishna">Upcoming</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((f) => (
          <GlassCard key={f.name} gold={f.daysLeft <= 10}>
            <div className="flex items-start justify-between">
              <span className="text-4xl">{f.emoji}</span>
              <span className="rounded-full bg-krishna/10 px-3 py-1 text-sm font-bold text-krishna">
                {f.daysLeft}d
              </span>
            </div>
            <h3 className="mt-3 font-serif text-xl font-bold text-krishna">{f.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">{f.date}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-krishna to-gold"
                style={{ width: `${Math.max(8, 100 - f.daysLeft)}%` }}
              />
            </div>
            <Button variant="outline" size="sm" className="mt-4">
              Special Challenge
            </Button>
          </GlassCard>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-4 font-serif text-xl font-bold text-krishna">Recently Celebrated</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((f) => (
              <GlassCard key={f.name} padding="p-4" className="opacity-75">
                <span className="text-2xl">{f.emoji}</span>
                <p className="mt-1 font-semibold text-krishna">{f.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{f.date}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
