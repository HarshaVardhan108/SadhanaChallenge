/** Daily sadhana streak + Lotus Garden (independent of challenges). */

export const DAILY_STREAK_STORAGE_KEY = "bhakti-daily-streak";

/** Lotus garden cycle length (days). */
export const LOTUS_GARDEN_DAYS = 21;

export type DailyStreakState = {
  /** ISO date strings YYYY-MM-DD that were marked complete (local calendar day). */
  completedDates: string[];
  /** Longest consecutive streak ever recorded. */
  bestStreak: number;
  updatedAt: string;
};

export type DailyStreakSnapshot = {
  /** Current consecutive days including today if marked. */
  currentStreak: number;
  bestStreak: number;
  /** Total days ever marked. */
  totalDays: number;
  /** Whether today's local date is already marked. */
  markedToday: boolean;
  /** Lotus: days bloomed in current garden cycle (= current streak, capped). */
  lotusCompleted: number;
  /** Lotus goal days. */
  lotusTotal: number;
  lotusPercent: number;
};

function emptyState(): DailyStreakState {
  return {
    completedDates: [],
    bestStreak: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Local calendar day key YYYY-MM-DD. */
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

function addDays(key: string, delta: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return localDateKey(d);
}

export function loadDailyStreak(): DailyStreakState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<DailyStreakState>;
    const dates = Array.isArray(parsed.completedDates)
      ? parsed.completedDates
          .filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x))
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort()
      : [];
    return {
      completedDates: dates,
      bestStreak: Math.max(0, Number(parsed.bestStreak) || 0),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return emptyState();
  }
}

export function saveDailyStreak(state: DailyStreakState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DAILY_STREAK_STORAGE_KEY,
      JSON.stringify({
        ...state,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* ignore */
  }
}

/** Count consecutive days ending at `endKey` (inclusive if endKey is completed). */
export function computeStreakEndingAt(
  completedDates: string[],
  endKey: string
): number {
  const set = new Set(completedDates);
  if (!set.has(endKey)) {
    // Streak may still be alive if yesterday was last mark (today not yet done)
    const yesterday = addDays(endKey, -1);
    if (!set.has(yesterday)) return 0;
    let key = yesterday;
    let n = 0;
    while (set.has(key)) {
      n += 1;
      key = addDays(key, -1);
    }
    return n;
  }
  let key = endKey;
  let n = 0;
  while (set.has(key)) {
    n += 1;
    key = addDays(key, -1);
  }
  return n;
}

export function getDailyStreakSnapshot(
  state?: DailyStreakState,
  now: Date = new Date()
): DailyStreakSnapshot {
  const s = state ?? loadDailyStreak();
  const today = localDateKey(now);
  const markedToday = s.completedDates.includes(today);
  const currentStreak = computeStreakEndingAt(s.completedDates, today);
  const bestStreak = Math.max(s.bestStreak, currentStreak);
  const lotusTotal = LOTUS_GARDEN_DAYS;
  // Garden blooms with the active daily streak (not challenges)
  const lotusCompleted = Math.min(currentStreak, lotusTotal);
  const lotusPercent =
    lotusTotal > 0 ? Math.round((lotusCompleted / lotusTotal) * 100) : 0;

  return {
    currentStreak,
    bestStreak,
    totalDays: s.completedDates.length,
    markedToday,
    lotusCompleted,
    lotusTotal,
    lotusPercent,
  };
}

/**
 * Mark today complete. Extends streak if yesterday was marked (or starts at 1).
 * Idempotent if already marked today.
 */
export function markTodayComplete(now: Date = new Date()): DailyStreakSnapshot {
  const state = loadDailyStreak();
  const today = localDateKey(now);
  if (!state.completedDates.includes(today)) {
    state.completedDates = [...state.completedDates, today].sort();
  }
  const snap = getDailyStreakSnapshot(state, now);
  state.bestStreak = Math.max(state.bestStreak, snap.currentStreak, snap.bestStreak);
  saveDailyStreak(state);
  return getDailyStreakSnapshot(state, now);
}

/** Undo today's mark (optional helper). */
export function unmarkToday(now: Date = new Date()): DailyStreakSnapshot {
  const state = loadDailyStreak();
  const today = localDateKey(now);
  state.completedDates = state.completedDates.filter((d) => d !== today);
  const snap = getDailyStreakSnapshot(state, now);
  // bestStreak is historical peak — keep max recorded
  state.bestStreak = Math.max(state.bestStreak, snap.currentStreak);
  saveDailyStreak(state);
  return getDailyStreakSnapshot(state, now);
}
