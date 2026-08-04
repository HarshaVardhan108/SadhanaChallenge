/**
 * Server-side user data: daily streak, shloka completions, settings (Convex).
 */
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../convex/_generated/dataModel";

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
  studyHoursDay: number;
  studyHoursWeek: number;
  studyHoursMonth: number;
};

export type DbStudyHoursLog = {
  date: string;
  hours: number;
  updatedAt: string | null;
};

function asUserId(userId: string): Id<"users"> {
  return userId as Id<"users">;
}

export async function dbGetStreak(userId: string): Promise<DbDailyStreak> {
  const convex = getConvexClient();
  return await convex.query(api.userData.getStreak, {
    userId: asUserId(userId),
  });
}

export async function dbSaveStreak(
  userId: string,
  data: { completedDates: string[]; bestStreak: number }
): Promise<DbDailyStreak> {
  const convex = getConvexClient();
  return await convex.mutation(api.userData.saveStreak, {
    userId: asUserId(userId),
    completedDates: data.completedDates,
    bestStreak: data.bestStreak,
  });
}

export async function dbGetShlokaCompletions(
  userId: string
): Promise<string[]> {
  const convex = getConvexClient();
  return await convex.query(api.userData.getShlokaCompletions, {
    userId: asUserId(userId),
  });
}

export async function dbSetShlokaCompletions(
  userId: string,
  shlokaIds: string[]
): Promise<string[]> {
  const convex = getConvexClient();
  return await convex.mutation(api.userData.setShlokaCompletions, {
    userId: asUserId(userId),
    shlokaIds,
  });
}

export async function dbToggleShlokaCompletion(
  userId: string,
  shlokaId: string
): Promise<{ completed: boolean; ids: string[] }> {
  const convex = getConvexClient();
  return await convex.mutation(api.userData.toggleShlokaCompletion, {
    userId: asUserId(userId),
    shlokaId,
  });
}

export async function dbGetSettings(userId: string): Promise<DbUserSettings> {
  const convex = getConvexClient();
  return await convex.query(api.userData.getSettings, {
    userId: asUserId(userId),
  });
}

export async function dbSaveSettings(
  userId: string,
  data: Partial<DbUserSettings>
): Promise<DbUserSettings> {
  const convex = getConvexClient();
  return await convex.mutation(api.userData.saveSettings, {
    userId: asUserId(userId),
    spiritualName: data.spiritualName,
    dailyRounds: data.dailyRounds,
    readingMinutes: data.readingMinutes,
    fluteAmbient: data.fluteAmbient,
    studyHoursDay: data.studyHoursDay,
    studyHoursWeek: data.studyHoursWeek,
    studyHoursMonth: data.studyHoursMonth,
  });
}

export async function dbGetStudyHoursLogs(
  userId: string,
  range?: { fromDate?: string; toDate?: string }
): Promise<DbStudyHoursLog[]> {
  const convex = getConvexClient();
  return await convex.query(api.userData.getStudyHoursLogs, {
    userId: asUserId(userId),
    fromDate: range?.fromDate,
    toDate: range?.toDate,
  });
}

export async function dbGetStudyHoursForDate(
  userId: string,
  date: string
): Promise<DbStudyHoursLog> {
  const convex = getConvexClient();
  return await convex.query(api.userData.getStudyHoursForDate, {
    userId: asUserId(userId),
    date,
  });
}

export async function dbSaveStudyHoursLog(
  userId: string,
  data: { date: string; hours: number }
): Promise<DbStudyHoursLog> {
  const convex = getConvexClient();
  return await convex.mutation(api.userData.saveStudyHoursLog, {
    userId: asUserId(userId),
    date: data.date,
    hours: data.hours,
  });
}
