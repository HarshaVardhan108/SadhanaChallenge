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
      };
    }
    return {
      spiritualName: row.spiritualName || "",
      dailyRounds: row.dailyRounds || 16,
      readingMinutes: row.readingMinutes || 20,
      fluteAmbient: Boolean(row.fluteAmbient),
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
        }
      : {
          spiritualName: "",
          dailyRounds: 16,
          readingMinutes: 20,
          fluteAmbient: false,
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
