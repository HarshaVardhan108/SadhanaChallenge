"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Settings,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isGuestUser } from "@/lib/guest";
import {
  hoursForDate,
  loadStudyHoursFromServer,
  loadStudyLogs,
  loadStudyTargets,
  localDateKey,
  monthRangeContaining,
  progressPct,
  saveStudyHoursForDate,
  saveStudyTargets,
  sumHoursInRange,
  weekRangeContaining,
  type StudyLogEntry,
  type StudyTargets,
} from "@/lib/study-hours";

function formatHours(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Locale-independent date label (avoids SSR/client locale mismatches). */
function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

function TargetCard({
  label,
  icon,
  actual,
  target,
  unit = "hrs",
}: {
  label: string;
  icon: React.ReactNode;
  actual: number;
  target: number;
  unit?: string;
}) {
  const pct = progressPct(actual, target);
  const met = target > 0 && actual >= target;
  return (
    <GlassCard padding="p-4" lift={false} className="flex flex-col">
      <div className="flex items-center gap-2 text-krishna">
        {icon}
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <p className="mt-2 font-serif text-2xl font-bold tabular-nums text-krishna">
        {formatHours(actual)}
        <span className="text-base font-medium text-[var(--text-muted)]">
          {" "}
          / {formatHours(target)} {unit}
        </span>
      </p>
      <ProgressBar
        value={pct}
        showLabel={false}
        height="h-2"
        className="mt-3"
        color={met ? "var(--color-tulasi, #2d8a5e)" : undefined}
      />
      <p className="mt-1.5 text-xs text-[var(--text-muted)]">
        {met ? "Target met ✨" : `${pct}% of target`}
      </p>
    </GlassCard>
  );
}

export default function StudyPage() {
  const [ready, setReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [targets, setTargets] = useState<StudyTargets>(() => ({
    day: 2,
    week: 14,
    month: 60,
  }));
  const [logs, setLogs] = useState<StudyLogEntry[]>([]);
  const [hoursInput, setHoursInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date windows are client-only (timezone-safe); filled after mount.
  const [today, setToday] = useState("");
  const [week, setWeek] = useState({ from: "", to: "" });
  const [month, setMonth] = useState({ from: "", to: "" });

  const refresh = useCallback(async (todayKey: string) => {
    setTargets(loadStudyTargets());
    const local = loadStudyLogs();
    setLogs(local);
    setHoursInput(
      hoursForDate(local, todayKey) > 0
        ? String(hoursForDate(local, todayKey))
        : ""
    );

    if (!isGuestUser()) {
      try {
        const [serverLogs, settingsRes] = await Promise.all([
          loadStudyHoursFromServer(),
          fetch("/api/user/settings", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : null
          ),
        ]);
        setLogs(serverLogs);
        setHoursInput(
          hoursForDate(serverLogs, todayKey) > 0
            ? String(hoursForDate(serverLogs, todayKey))
            : ""
        );
        const s = settingsRes?.settings as
          | {
              studyHoursDay?: number;
              studyHoursWeek?: number;
              studyHoursMonth?: number;
            }
          | undefined;
        if (s) {
          const next: StudyTargets = {
            day: s.studyHoursDay ?? 2,
            week: s.studyHoursWeek ?? 14,
            month: s.studyHoursMonth ?? 60,
          };
          setTargets(next);
          saveStudyTargets(next);
        }
      } catch {
        /* offline */
      }
    }
  }, []);

  useEffect(() => {
    const todayKey = localDateKey();
    setToday(todayKey);
    setWeek(weekRangeContaining());
    setMonth(monthRangeContaining());
    setIsGuest(isGuestUser());
    void refresh(todayKey).finally(() => setReady(true));
  }, [refresh]);

  const todayHours = today ? hoursForDate(logs, today) : 0;
  const weekHours =
    week.from && week.to ? sumHoursInRange(logs, week.from, week.to) : 0;
  const monthHours =
    month.from && month.to ? sumHoursInRange(logs, month.from, month.to) : 0;

  const recentLogs = useMemo(
    () => logs.filter((l) => l.hours > 0).slice(0, 14),
    [logs]
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const n = Number(hoursInput);
    if (!Number.isFinite(n) || n < 0 || n > 24) {
      setError("Enter hours between 0 and 24.");
      setSaving(false);
      return;
    }
    try {
      const entry = await saveStudyHoursForDate(today, n);
      setLogs(loadStudyLogs());
      setHoursInput(entry.hours > 0 ? String(entry.hours) : "");
      setMessage(
        entry.hours === 0
          ? "Cleared today’s study log."
          : `Logged ${formatHours(entry.hours)} hour${entry.hours === 1 ? "" : "s"} for today.`
      );
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-krishna" />
        Loading study hours…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Study Hours"
        subtitle="Set targets in Settings, then log how many hours you studied each day."
        emoji="📚"
        action={
          <Link href="/settings">
            <Button variant="outline" size="sm" className="min-h-11">
              <Settings className="h-4 w-4" />
              Edit targets
            </Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl space-y-5">
        {isGuest && (
          <GlassCard padding="p-4" lift={false} className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Guests can log hours on this device only. Log in to sync across
              devices.
            </p>
            <Link
              href="/please-login?reason=study&next=/study"
              className="mt-3 inline-block"
            >
              <Button variant="primary" size="sm">
                Login to sync
              </Button>
            </Link>
          </GlassCard>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <TargetCard
            label="Today"
            icon={<Clock className="h-4 w-4" />}
            actual={todayHours}
            target={targets.day}
          />
          <TargetCard
            label="This week"
            icon={<Calendar className="h-4 w-4" />}
            actual={weekHours}
            target={targets.week}
          />
          <TargetCard
            label="This month"
            icon={<Target className="h-4 w-4" />}
            actual={monthHours}
            target={targets.month}
          />
        </div>

        <GlassCard>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-krishna/10 text-krishna">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg font-bold text-krishna">
                Log today&apos;s study
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {formatDisplayDate(today)} · Daily target{" "}
                {formatHours(targets.day)} hrs
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Hours studied today"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                placeholder="e.g. 2.5"
                value={hoursInput}
                onChange={(e) => {
                  setHoursInput(e.target.value);
                  setMessage(null);
                  setError(null);
                }}
              />
            </div>
            <Button
              variant="primary"
              className="min-h-11 sm:mb-0.5"
              disabled={saving || hoursInput === ""}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save hours"
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 1.5, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setHoursInput(String(n));
                  setMessage(null);
                  setError(null);
                }}
                className="rounded-full border border-gold/40 bg-cream px-3 py-1.5 text-xs font-semibold text-krishna transition hover:bg-gold/25"
              >
                {formatHours(n)}h
              </button>
            ))}
          </div>

          {message && (
            <p className="mt-3 text-sm font-medium text-tulasi" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm font-medium text-rose-600" role="alert">
              {error}
            </p>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="font-serif text-lg font-bold text-krishna">
            Recent days
          </h2>
          {recentLogs.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              No study hours logged yet. Enter today&apos;s hours above to get
              started.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gold/20">
              {recentLogs.map((log) => (
                <li
                  key={log.date}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="text-[var(--text-primary)]">
                    {formatDisplayDate(log.date)}
                    {log.date === today && (
                      <span className="ml-2 rounded-full bg-krishna/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-krishna">
                        Today
                      </span>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums text-krishna">
                    {formatHours(log.hours)} hrs
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Change day / week / month targets in{" "}
          <Link href="/settings" className="font-semibold text-krishna underline">
            Settings → Study targets
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
