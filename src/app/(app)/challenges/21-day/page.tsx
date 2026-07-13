"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { LotusProgress } from "@/components/ui/LotusProgress";
import { Button } from "@/components/ui/Button";
import { challenges } from "@/lib/data";
import { Check } from "lucide-react";

const challenge = challenges[1];

export default function TwentyOneDayPage() {
  const [done, setDone] = useState<Record<string, boolean>>({
    "16 rounds of japa": true,
    "Bhagavad Gita reading": true,
    "Lecture hearing": true,
    "Learn one shloka": false,
    "Offer prasadam": true,
    "Morning program": false,
    "Write gratitude": false,
  });

  const total = challenge.tasks.length;
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="21 Day Deepen Your Bhakti"
        subtitle="Advanced daily sadhana with beautiful progress tracking."
        emoji="🥇"
        action={
          <Link href="/challenges">
            <Button variant="outline">All Challenges</Button>
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <GlassCard gold lift={false} className="flex flex-col items-center py-8">
          <LotusProgress completed={12} total={21} size={260} />
          <p className="mt-4 rounded-full bg-gold/40 px-4 py-1 text-sm font-semibold text-krishna">
            Badge: Golden Lotus
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-xl font-bold text-krishna">Daily Sadhana</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {completed} of {total} offerings complete today
          </p>
          <ul className="mt-5 space-y-2.5">
            {challenge.tasks.map((task) => {
              const isDone = !!done[task];
              return (
                <li key={task}>
                  <button
                    type="button"
                    onClick={() => setDone((d) => ({ ...d, [task]: !d[task] }))}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isDone
                        ? "border-gold bg-gold/20"
                        : "border-gold/40 bg-white hover:border-krishna/30 hover:bg-cream"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-krishna bg-krishna text-white"
                          : "border-gold/50"
                      }`}
                    >
                      {isDone && <Check className="h-4 w-4" />}
                    </span>
                    <span className="text-sm md:text-base">{task}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </div>

      {/* Week strip */}
      <GlassCard className="mt-8">
        <h3 className="font-serif text-lg font-bold text-krishna">21-Day Map</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 21 }, (_, i) => {
            const day = i + 1;
            const status = day < 12 ? "done" : day === 12 ? "today" : "future";
            return (
              <div
                key={day}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                  status === "done"
                    ? "bg-tulasi text-white"
                    : status === "today"
                      ? "bg-gold text-krishna ring-2 ring-krishna"
                      : "bg-cream text-[var(--text-muted)] border border-gold/25"
                }`}
                title={`Day ${day}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
