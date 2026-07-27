import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveSubscription = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.null())),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    enabled: v.boolean(),
    timezone: v.string(),
    hour: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: args.userId ?? existing.userId ?? null,
        p256dh: args.p256dh,
        auth: args.auth,
        enabled: args.enabled,
        timezone: args.timezone,
        hour: args.hour,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId ?? null,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      enabled: args.enabled,
      timezone: args.timezone,
      hour: args.hour,
      lastSentDate: null,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const setEnabled = mutation({
  args: { endpoint: v.string(), enabled: v.boolean() },
  handler: async (ctx, { endpoint, enabled }) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { enabled, updatedAt: Date.now() });
    }
  },
});

export const listEnabled = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
    return rows.map((r) => ({
      id: r._id as string,
      user_id: r.userId ? String(r.userId) : null,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth,
      enabled: r.enabled,
      timezone: r.timezone,
      hour: r.hour,
      last_sent_date: r.lastSentDate ?? null,
    }));
  },
});

export const markSent = mutation({
  args: { id: v.id("pushSubscriptions"), dateKey: v.string() },
  handler: async (ctx, { id, dateKey }) => {
    await ctx.db.patch(id, {
      lastSentDate: dateKey,
      updatedAt: Date.now(),
    });
  },
});
