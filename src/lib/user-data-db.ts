/**
 * Server-side user data: daily streak, shloka completions, settings.
 */
import { query } from "@/lib/db";

export type DbDailyStreak = {
  completedDates: string[];
  bestStreak: number;
  updatedAt: string;
};

export type DbUserSettings = {
  spiritualName: string;
  dailyRounds: number;
  readingMinutes: number;
  fluteAmbient: boolean;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}

export async function dbGetStreak(userId: string): Promise<DbDailyStreak> {
  const r = await query<{
    completed_dates: unknown;
    best_streak: number;
    updated_at: Date | string;
  }>(
    `SELECT completed_dates, best_streak, updated_at
     FROM daily_streaks WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const row = r.rows[0];
  if (!row) {
    return { completedDates: [], bestStreak: 0, updatedAt: new Date().toISOString() };
  }
  return {
    completedDates: asStringArray(row.completed_dates),
    bestStreak: Number(row.best_streak) || 0,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at.toISOString(),
  };
}

export async function dbSaveStreak(
  userId: string,
  data: { completedDates: string[]; bestStreak: number }
): Promise<DbDailyStreak> {
  const dates = [...new Set(data.completedDates)].sort();
  const best = Math.max(0, Number(data.bestStreak) || 0);
  await query(
    `INSERT INTO daily_streaks (user_id, completed_dates, best_streak, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       completed_dates = EXCLUDED.completed_dates,
       best_streak = EXCLUDED.best_streak,
       updated_at = NOW()`,
    [userId, JSON.stringify(dates), best]
  );
  return dbGetStreak(userId);
}

export async function dbGetShlokaCompletions(
  userId: string
): Promise<string[]> {
  const r = await query<{ shloka_id: string }>(
    `SELECT shloka_id FROM user_shloka_completions WHERE user_id = $1`,
    [userId]
  );
  return r.rows.map((x) => x.shloka_id);
}

export async function dbSetShlokaCompletions(
  userId: string,
  shlokaIds: string[]
): Promise<string[]> {
  const ids = [...new Set(shlokaIds.map(String).filter(Boolean))];
  await query(`DELETE FROM user_shloka_completions WHERE user_id = $1`, [
    userId,
  ]);
  for (const id of ids) {
    await query(
      `INSERT INTO user_shloka_completions (user_id, shloka_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, id]
    );
  }
  return ids;
}

export async function dbToggleShlokaCompletion(
  userId: string,
  shlokaId: string
): Promise<{ completed: boolean; ids: string[] }> {
  const existing = await query(
    `SELECT 1 FROM user_shloka_completions WHERE user_id = $1 AND shloka_id = $2`,
    [userId, shlokaId]
  );
  if (existing.rows.length > 0) {
    await query(
      `DELETE FROM user_shloka_completions WHERE user_id = $1 AND shloka_id = $2`,
      [userId, shlokaId]
    );
    const ids = await dbGetShlokaCompletions(userId);
    return { completed: false, ids };
  }
  await query(
    `INSERT INTO user_shloka_completions (user_id, shloka_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, shlokaId]
  );
  const ids = await dbGetShlokaCompletions(userId);
  return { completed: true, ids };
}

export async function dbGetSettings(userId: string): Promise<DbUserSettings> {
  const r = await query<{
    spiritual_name: string;
    daily_rounds: number;
    reading_minutes: number;
    flute_ambient: boolean;
  }>(
    `SELECT spiritual_name, daily_rounds, reading_minutes, flute_ambient
     FROM user_settings WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  const row = r.rows[0];
  if (!row) {
    return {
      spiritualName: "",
      dailyRounds: 16,
      readingMinutes: 20,
      fluteAmbient: false,
    };
  }
  return {
    spiritualName: row.spiritual_name || "",
    dailyRounds: Number(row.daily_rounds) || 16,
    readingMinutes: Number(row.reading_minutes) || 20,
    fluteAmbient: Boolean(row.flute_ambient),
  };
}

export async function dbSaveSettings(
  userId: string,
  data: Partial<DbUserSettings>
): Promise<DbUserSettings> {
  const current = await dbGetSettings(userId);
  const next: DbUserSettings = {
    spiritualName:
      data.spiritualName !== undefined
        ? data.spiritualName
        : current.spiritualName,
    dailyRounds:
      data.dailyRounds !== undefined ? data.dailyRounds : current.dailyRounds,
    readingMinutes:
      data.readingMinutes !== undefined
        ? data.readingMinutes
        : current.readingMinutes,
    fluteAmbient:
      data.fluteAmbient !== undefined
        ? data.fluteAmbient
        : current.fluteAmbient,
  };
  await query(
    `INSERT INTO user_settings
      (user_id, spiritual_name, daily_rounds, reading_minutes, flute_ambient, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       spiritual_name = EXCLUDED.spiritual_name,
       daily_rounds = EXCLUDED.daily_rounds,
       reading_minutes = EXCLUDED.reading_minutes,
       flute_ambient = EXCLUDED.flute_ambient,
       updated_at = NOW()`,
    [
      userId,
      next.spiritualName,
      next.dailyRounds,
      next.readingMinutes,
      next.fluteAmbient,
    ]
  );
  return next;
}
