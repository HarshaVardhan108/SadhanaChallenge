/** Client-side study hours targets + daily logs (local cache + API sync). */

export const STUDY_TARGETS_KEY = "bhakti-study-targets";
export const STUDY_LOGS_KEY = "bhakti-study-logs";

export type StudyTargets = {
  day: number;
  week: number;
  month: number;
};

export type StudyLogEntry = {
  date: string;
  hours: number;
  updatedAt?: string | null;
};

export const DEFAULT_STUDY_TARGETS: StudyTargets = {
  day: 2,
  week: 14,
  month: 60,
};

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-start week range containing `date`. */
export function weekRangeContaining(date: Date = new Date()): {
  from: string;
  to: string;
} {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: localDateKey(monday), to: localDateKey(sunday) };
}

/** Calendar month range containing `date`. */
export function monthRangeContaining(date: Date = new Date()): {
  from: string;
  to: string;
} {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = localDateKey(new Date(y, m, 1));
  const to = localDateKey(new Date(y, m + 1, 0));
  return { from, to };
}

export function loadStudyTargets(): StudyTargets {
  if (typeof window === "undefined") return { ...DEFAULT_STUDY_TARGETS };
  try {
    const raw = localStorage.getItem(STUDY_TARGETS_KEY);
    if (!raw) return { ...DEFAULT_STUDY_TARGETS };
    const p = JSON.parse(raw) as Partial<StudyTargets>;
    return {
      day: Math.max(0, Number(p.day) || DEFAULT_STUDY_TARGETS.day),
      week: Math.max(0, Number(p.week) || DEFAULT_STUDY_TARGETS.week),
      month: Math.max(0, Number(p.month) || DEFAULT_STUDY_TARGETS.month),
    };
  } catch {
    return { ...DEFAULT_STUDY_TARGETS };
  }
}

export function saveStudyTargets(targets: StudyTargets): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STUDY_TARGETS_KEY,
      JSON.stringify({
        day: Math.max(0, Number(targets.day) || 0),
        week: Math.max(0, Number(targets.week) || 0),
        month: Math.max(0, Number(targets.month) || 0),
      })
    );
  } catch {
    /* ignore */
  }
}

export function loadStudyLogs(): StudyLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDY_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is StudyLogEntry =>
          x != null &&
          typeof x === "object" &&
          typeof (x as StudyLogEntry).date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test((x as StudyLogEntry).date) &&
          typeof (x as StudyLogEntry).hours === "number"
      )
      .map((x) => ({
        date: x.date,
        hours: Math.max(0, Math.min(24, x.hours)),
        updatedAt: x.updatedAt ?? null,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function saveStudyLogs(logs: StudyLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STUDY_LOGS_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}

export function upsertLocalLog(entry: StudyLogEntry): StudyLogEntry[] {
  const logs = loadStudyLogs().filter((l) => l.date !== entry.date);
  if (entry.hours > 0) {
    logs.push({
      date: entry.date,
      hours: Math.max(0, Math.min(24, entry.hours)),
      updatedAt: entry.updatedAt ?? new Date().toISOString(),
    });
  }
  logs.sort((a, b) => b.date.localeCompare(a.date));
  saveStudyLogs(logs);
  return logs;
}

export function hoursForDate(
  logs: StudyLogEntry[],
  date: string
): number {
  return logs.find((l) => l.date === date)?.hours ?? 0;
}

export function sumHoursInRange(
  logs: StudyLogEntry[],
  from: string,
  to: string
): number {
  return logs
    .filter((l) => l.date >= from && l.date <= to)
    .reduce((sum, l) => sum + l.hours, 0);
}

export function progressPct(actual: number, target: number): number {
  if (target <= 0) return actual > 0 ? 100 : 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

function isLoggedInClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("bhakti-guest") === "1") return false;
    return Boolean(localStorage.getItem("bhakti-user"));
  } catch {
    return false;
  }
}

/** Load logs for the current month window from server (and cache locally). */
export async function loadStudyHoursFromServer(): Promise<StudyLogEntry[]> {
  if (!isLoggedInClient()) {
    return loadStudyLogs();
  }
  try {
    const { from } = monthRangeContaining();
    // Include previous month start of week spill for weekly view
    const fromDate = parseKey(from);
    fromDate.setDate(fromDate.getDate() - 7);
    const fromKey = localDateKey(fromDate);
    const toKey = localDateKey();

    const res = await fetch(
      `/api/study-hours?from=${encodeURIComponent(fromKey)}&to=${encodeURIComponent(toKey)}`,
      { credentials: "include" }
    );
    if (res.ok) {
      const data = (await res.json()) as { logs?: StudyLogEntry[] };
      if (Array.isArray(data.logs)) {
        // Merge with any older local cache outside this range
        const local = loadStudyLogs();
        const byDate = new Map<string, StudyLogEntry>();
        for (const l of local) byDate.set(l.date, l);
        for (const l of data.logs) byDate.set(l.date, l);
        const merged = [...byDate.values()].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        saveStudyLogs(merged);
        return merged;
      }
    }
  } catch {
    /* offline */
  }
  return loadStudyLogs();
}

/** Save hours for a date; syncs to server when logged in. */
export async function saveStudyHoursForDate(
  date: string,
  hours: number
): Promise<StudyLogEntry> {
  const clamped = Math.max(0, Math.min(24, Math.round(hours * 100) / 100));
  const local: StudyLogEntry = {
    date,
    hours: clamped,
    updatedAt: new Date().toISOString(),
  };
  upsertLocalLog(local);

  if (!isLoggedInClient()) {
    return local;
  }

  try {
    const res = await fetch("/api/study-hours", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hours: clamped }),
    });
    if (res.ok) {
      const data = (await res.json()) as { log?: StudyLogEntry };
      if (data.log) {
        upsertLocalLog(data.log);
        return data.log;
      }
    }
  } catch {
    /* offline — local already saved */
  }
  return local;
}
