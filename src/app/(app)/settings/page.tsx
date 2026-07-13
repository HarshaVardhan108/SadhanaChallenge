"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

const reminders = [
  "Mangala Arati",
  "Japa Reminder",
  "Reading Reminder",
  "Lecture Reminder",
  "Festival Reminder",
  "Ekadashi Reminder",
  "Appearance Day Reminder",
  "Sleep Reminder",
  "Motivational Quote",
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(reminders.map((r) => [r, true]))
  );
  const [flute, setFlute] = useState(false);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Tune your spiritual practice experience"
        emoji="⚙️"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">Account</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Display Name" defaultValue="Harsha" />
            <Input label="Spiritual Name" placeholder="Optional" />
            <Input label="Email" type="email" defaultValue="harsha@example.com" />
            <Input label="Temple" defaultValue="ISKCON Bangalore" />
          </div>
          <Button variant="primary" className="mt-4" size="sm">
            Save Changes
          </Button>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">Sadhana Goals</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select label="Daily Rounds" defaultValue="16">
              {[4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} rounds
                </option>
              ))}
            </Select>
            <Select label="Reading minutes/day" defaultValue="20">
              {[10, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} min
                </option>
              ))}
            </Select>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">Notifications</h2>
          <ul className="mt-4 space-y-3">
            {reminders.map((r) => (
              <li key={r} className="flex items-center justify-between">
                <span className="text-sm">{r}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggles[r]}
                  onClick={() => setToggles((t) => ({ ...t, [r]: !t[r] }))}
                  className={`relative h-7 w-12 rounded-full transition ${
                    toggles[r] ? "bg-krishna" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      toggles[r] ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">Atmosphere</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Krishna&apos;s flute melody</p>
              <p className="text-xs text-[var(--text-muted)]">
                Soft ambient flute while browsing
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={flute}
              onClick={() => setFlute(!flute)}
              className={`relative h-7 w-12 rounded-full transition ${
                flute ? "bg-krishna" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  flute ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
