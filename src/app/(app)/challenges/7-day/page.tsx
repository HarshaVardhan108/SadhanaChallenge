"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { OfferingToast } from "@/components/ambient/OfferingToast";
import { challenges } from "@/lib/data";
import { Check } from "lucide-react";

const challenge = challenges[0];

export default function SevenDayChallengePage() {
  const [done, setDone] = useState<Record<string, boolean>>({
    "4 rounds of japa": true,
    "10 minutes reading": true,
    "One lecture": true,
    "Offer food (prasadam)": true,
  });
  const [toast, setToast] = useState(false);

  const total = challenge.tasks.length;
  const completed = Object.values(done).filter(Boolean).length;

  const toggleTask = (task: string) => {
    setDone((d) => {
      const next = !d[task];
      if (next) {
        setToast(true);
        setTimeout(() => setToast(false), 2200);
      }
      return { ...d, [task]: next };
    });
  };

  return (
    <div>
      <PageHeader
        title="7 Day Sadhana Challenge"
        subtitle="Designed for beginners. Earn the Silver Lotus badge."
        emoji="🥈"
        action={
          <Link href="/challenges">
            <Button variant="outline">All Challenges</Button>
          </Link>
        }
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <GlassCard gold className="lg:col-span-1 text-center">
          <p className="text-5xl">🪷</p>
          <p className="mt-2 font-serif text-xl font-bold text-krishna">Silver Lotus</p>
          <p className="text-sm text-[var(--text-muted)]">Completion badge</p>
          <div className="mt-4">
            <ProgressBar value={(completed / total) * 100} />
          </div>
          <p className="mt-2 text-sm">
            Day 4 of 7 · {completed}/{total} today
          </p>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="font-serif text-xl font-bold text-krishna">Today&apos;s Offerings</h2>
          <ul className="mt-4 space-y-3">
            {challenge.tasks.map((task) => {
              const isDone = !!done[task];
              return (
                <li key={task}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isDone
                        ? "border-tulasi/50 bg-tulasi/15"
                        : "border-gold/40 bg-white hover:border-krishna/30 hover:bg-cream"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-tulasi bg-tulasi text-white"
                          : "border-gold/50 bg-white"
                      }`}
                    >
                      {isDone && <Check className="h-4 w-4" />}
                    </span>
                    <span className={isDone ? "line-through opacity-70" : ""}>{task}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {completed === total && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-gold/40 to-saffron/30 p-4 text-center">
              <p className="font-serif text-lg font-bold text-krishna">
                🎉 Day complete! Offering accepted by Krishna
              </p>
            </div>
          )}
        </GlassCard>
      </div>
      <OfferingToast show={toast} />
    </div>
  );
}
