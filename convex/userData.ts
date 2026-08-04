import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("dailyStreaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) {
      return {
        completedDates: [] as string[],
        bestStreak: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      completedDates: row.completedDates || [],
      bestStreak: row.bestStreak || 0,
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  },
});

export const saveStreak = mutation({
  args: {
    userId: v.id("users"),
    completedDates: v.array(v.string()),
    bestStreak: v.number(),
  },
  handler: async (ctx, { userId, completedDates, bestStreak }) => {
    const dates = [...new Set(completedDates)].sort();
    const best = Math.max(0, bestStreak || 0);
    const now = Date.now();
    const existing = await ctx.db
      .query("dailyStreaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        completedDates: dates,
        bestStreak: best,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("dailyStreaks", {
        userId,
        completedDates: dates,
        bestStreak: best,
        updatedAt: now,
      });
    }
    return {
      completedDates: dates,
      bestStreak: best,
      updatedAt: new Date(now).toISOString(),
    };
  },
});

export const getShlokaCompletions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("userShlokaCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => r.shlokaId);
  },
});

export const setShlokaCompletions = mutation({
  args: {
    userId: v.id("users"),
    shlokaIds: v.array(v.string()),
  },
  handler: async (ctx, { userId, shlokaIds }) => {
    const ids = [...new Set(shlokaIds.map(String).filter(Boolean))];
    const existing = await ctx.db
      .query("userShlokaCompletions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    const now = Date.now();
    for (const shlokaId of ids) {
      await ctx.db.insert("userShlokaCompletions", {
        userId,
        shlokaId,
        completedAt: now,
      });
    }
    return ids;
  },
});

export const toggleShlokaCompletion = mutation({
  args: {
    userId: v.id("users"),
    shlokaId: v.string(),
  },
  handler: async (ctx, { userId, shlokaId }) => {
    const existing = await ctx.db
      .query("userShlokaCompletions")
      .withIndex("by_user_shloka", (q) =>
        q.eq("userId", userId).eq("shlokaId", shlokaId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const ids = (
        await ctx.db
          .query("userShlokaCompletions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect()
      ).map((r) => r.shlokaId);
      return { completed: false, ids };
    }

    await ctx.db.insert("userShlokaCompletions", {
      userId,
      shlokaId,
      completedAt: Date.now(),
    });
    const ids = (
      await ctx.db
        .query("userShlokaCompletions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).map((r) => r.shlokaId);
    return { completed: true, ids };
  },
});

const DEFAULT_STUDY_HOURS_DAY = 2;
const DEFAULT_STUDY_HOURS_WEEK = 14;
const DEFAULT_STUDY_HOURS_MONTH = 60;

function clampHours(n: number, max = 24 * 31): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, Math.round(n * 100) / 100);
}

export const getSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) {
      return {
        spiritualName: "",
        dailyRounds: 16,
        readingMinutes: 20,
        fluteAmbient: false,
        studyHoursDay: DEFAULT_STUDY_HOURS_DAY,
        studyHoursWeek: DEFAULT_STUDY_HOURS_WEEK,
        studyHoursMonth: DEFAULT_STUDY_HOURS_MONTH,
      };
    }
    return {
      spiritualName: row.spiritualName || "",
      dailyRounds: row.dailyRounds || 16,
      readingMinutes: row.readingMinutes || 20,
      fluteAmbient: Boolean(row.fluteAmbient),
      studyHoursDay: row.studyHoursDay ?? DEFAULT_STUDY_HOURS_DAY,
      studyHoursWeek: row.studyHoursWeek ?? DEFAULT_STUDY_HOURS_WEEK,
      studyHoursMonth: row.studyHoursMonth ?? DEFAULT_STUDY_HOURS_MONTH,
    };
  },
});

export const saveSettings = mutation({
  args: {
    userId: v.id("users"),
    spiritualName: v.optional(v.string()),
    dailyRounds: v.optional(v.number()),
    readingMinutes: v.optional(v.number()),
    fluteAmbient: v.optional(v.boolean()),
    studyHoursDay: v.optional(v.number()),
    studyHoursWeek: v.optional(v.number()),
    studyHoursMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    const current = existing
      ? {
          spiritualName: existing.spiritualName || "",
          dailyRounds: existing.dailyRounds || 16,
          readingMinutes: existing.readingMinutes || 20,
          fluteAmbient: Boolean(existing.fluteAmbient),
          studyHoursDay: existing.studyHoursDay ?? DEFAULT_STUDY_HOURS_DAY,
          studyHoursWeek: existing.studyHoursWeek ?? DEFAULT_STUDY_HOURS_WEEK,
          studyHoursMonth:
            existing.studyHoursMonth ?? DEFAULT_STUDY_HOURS_MONTH,
        }
      : {
          spiritualName: "",
          dailyRounds: 16,
          readingMinutes: 20,
          fluteAmbient: false,
          studyHoursDay: DEFAULT_STUDY_HOURS_DAY,
          studyHoursWeek: DEFAULT_STUDY_HOURS_WEEK,
          studyHoursMonth: DEFAULT_STUDY_HOURS_MONTH,
        };

    const next = {
      spiritualName:
        args.spiritualName !== undefined
          ? args.spiritualName
          : current.spiritualName,
      dailyRounds:
        args.dailyRounds !== undefined ? args.dailyRounds : current.dailyRounds,
      readingMinutes:
        args.readingMinutes !== undefined
          ? args.readingMinutes
          : current.readingMinutes,
      fluteAmbient:
        args.fluteAmbient !== undefined
          ? args.fluteAmbient
          : current.fluteAmbient,
      studyHoursDay:
        args.studyHoursDay !== undefined
          ? clampHours(args.studyHoursDay, 24)
          : current.studyHoursDay,
      studyHoursWeek:
        args.studyHoursWeek !== undefined
          ? clampHours(args.studyHoursWeek, 24 * 7)
          : current.studyHoursWeek,
      studyHoursMonth:
        args.studyHoursMonth !== undefined
          ? clampHours(args.studyHoursMonth, 24 * 31)
          : current.studyHoursMonth,
    };

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...next, updatedAt: now });
    } else {
      await ctx.db.insert("userSettings", {
        userId: args.userId,
        ...next,
        updatedAt: now,
      });
    }
    return next;
  },
});

export const getStudyHoursLogs = query({
  args: {
    userId: v.id("users"),
    /** Inclusive start date YYYY-MM-DD */
    fromDate: v.optional(v.string()),
    /** Inclusive end date YYYY-MM-DD */
    toDate: v.optional(v.string()),
  },
  handler: async (ctx, { userId, fromDate, toDate }) => {
    const rows = await ctx.db
      .query("studyHoursLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .filter((r) => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return true;
      })
      .map((r) => ({
        date: r.date,
        hours: r.hours,
        updatedAt: new Date(r.updatedAt).toISOString(),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const getStudyHoursForDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }) => {
    const row = await ctx.db
      .query("studyHoursLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (!row) return { date, hours: 0, updatedAt: null as string | null };
    return {
      date: row.date,
      hours: row.hours,
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  },
});

export const saveStudyHoursLog = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    hours: v.number(),
  },
  handler: async (ctx, { userId, date, hours }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD.");
    }
    const hrs = clampHours(hours, 24);
    const now = Date.now();
    const existing = await ctx.db
      .query("studyHoursLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();

    if (hrs === 0 && existing) {
      await ctx.db.delete(existing._id);
      return { date, hours: 0, updatedAt: new Date(now).toISOString() };
    }

    if (existing) {
      await ctx.db.patch(existing._id, { hours: hrs, updatedAt: now });
    } else if (hrs > 0) {
      await ctx.db.insert("studyHoursLogs", {
        userId,
        date,
        hours: hrs,
        updatedAt: now,
      });
    }
    return { date, hours: hrs, updatedAt: new Date(now).toISOString() };
  },
});
