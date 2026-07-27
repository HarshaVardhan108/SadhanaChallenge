import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export type PublicUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  temple: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
  inviteCode: string | null;
  invitedByUserId: string | null;
  createdAt: number;
  passwordHash: string;
};

function digitsOnly(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  return d || null;
}

function toPublic(doc: Doc<"users">): PublicUser {
  return {
    id: doc._id,
    fullName: doc.fullName || "",
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    temple: doc.temple ?? null,
    city: doc.city ?? null,
    country: doc.country ?? null,
    avatarUrl: doc.avatarUrl ?? null,
    inviteCode: doc.inviteCode ?? null,
    invitedByUserId: doc.invitedByUserId ?? null,
    createdAt: doc.createdAt,
    passwordHash: doc.passwordHash,
  };
}

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    return doc ? toPublic(doc) : null;
  },
});

export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const doc = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    return doc ? toPublic(doc) : null;
  },
});

export const findByPhoneDigits = query({
  args: { phoneDigits: v.string() },
  handler: async (ctx, { phoneDigits }) => {
    const value = phoneDigits.replace(/\D/g, "");
    if (!value) return null;

    const exact = await ctx.db
      .query("users")
      .withIndex("by_phone_digits", (q) => q.eq("phoneDigits", value))
      .unique();
    if (exact) return toPublic(exact);

    // Tail match (last 10 digits) — scan candidates with same ending is hard
    // without full table scan; try last-10 as alternate key.
    if (value.length >= 10) {
      const tail = value.slice(-10);
      const byTail = await ctx.db
        .query("users")
        .withIndex("by_phone_digits", (q) => q.eq("phoneDigits", tail))
        .unique();
      if (byTail) return toPublic(byTail);
    }

    // Fallback: scan users (small scale) for suffix match
    const all = await ctx.db.query("users").collect();
    const hit = all.find((u) => {
      const d = u.phoneDigits || "";
      return d === value || d.endsWith(value) || value.endsWith(d.slice(-10));
    });
    return hit ? toPublic(hit) : null;
  },
});

export const listForInvites = query({
  args: { excludeUserId: v.optional(v.union(v.id("users"), v.null())) },
  handler: async (ctx, { excludeUserId }) => {
    const rows = await ctx.db.query("users").collect();
    return rows
      .filter((u) => !excludeUserId || u._id !== excludeUserId)
      .sort((a, b) =>
        (a.fullName || "").localeCompare(b.fullName || "", undefined, {
          sensitivity: "base",
        })
      )
      .slice(0, 200)
      .map((u) => ({
        id: u._id as string,
        fullName: (u.fullName || "").trim() || "Devotee",
        email: u.email ?? null,
        phone: u.phone ?? null,
        temple: u.temple ?? null,
        city: u.city ?? null,
      }));
  },
});

export const countUsers = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("users").collect();
    return rows.length;
  },
});

export const register = mutation({
  args: {
    fullName: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    phone: v.optional(v.union(v.string(), v.null())),
    passwordHash: v.string(),
    temple: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    invitedByUserId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, args) => {
    const email = args.email ? args.email.trim().toLowerCase() : null;
    const phone = args.phone ? args.phone.trim() : null;
    const phoneDigits = digitsOnly(phone);
    const now = Date.now();

    if (email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (existing) throw new Error("EMAIL_EXISTS");
    }
    if (phoneDigits) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_phone_digits", (q) => q.eq("phoneDigits", phoneDigits))
        .unique();
      if (existing) throw new Error("PHONE_EXISTS");
    }

    const id = await ctx.db.insert("users", {
      fullName: args.fullName.trim(),
      email,
      phone,
      phoneDigits,
      passwordHash: args.passwordHash,
      temple: args.temple || "",
      city: args.city || "",
      country: args.country || "India",
      avatarUrl: null,
      inviteCode: null,
      invitedByUserId: args.invitedByUserId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return toPublic((await ctx.db.get(id))!);
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    fullName: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    phone: v.optional(v.union(v.string(), v.null())),
    temple: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    country: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("NOT_FOUND");

    const email =
      args.email === undefined
        ? doc.email
        : args.email
          ? args.email.trim().toLowerCase()
          : null;
    const phone =
      args.phone === undefined
        ? doc.phone
        : args.phone
          ? args.phone.trim()
          : null;
    const phoneDigits = digitsOnly(phone ?? null);

    if (email) {
      const clash = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (clash && clash._id !== args.id) throw new Error("EMAIL_EXISTS");
    }

    await ctx.db.patch(args.id, {
      fullName: args.fullName.trim(),
      email,
      phone,
      phoneDigits,
      temple: args.temple !== undefined ? args.temple : doc.temple,
      city: args.city !== undefined ? args.city : doc.city,
      country: args.country !== undefined ? args.country : doc.country,
      updatedAt: Date.now(),
    });

    return toPublic((await ctx.db.get(args.id))!);
  },
});

export const setAvatarUrl = mutation({
  args: {
    id: v.id("users"),
    avatarUrl: v.string(),
  },
  handler: async (ctx, { id, avatarUrl }) => {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("NOT_FOUND");
    await ctx.db.patch(id, { avatarUrl, updatedAt: Date.now() });
    return toPublic((await ctx.db.get(id))!);
  },
});

export const ensureInviteCode = mutation({
  args: {
    id: v.id("users"),
    code: v.string(),
  },
  handler: async (ctx, { id, code }) => {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("NOT_FOUND");
    if (doc.inviteCode) return doc.inviteCode;

    const normalized = code.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", normalized))
      .unique();
    if (existing && existing._id !== id) {
      throw new Error("CODE_COLLISION");
    }

    await ctx.db.patch(id, { inviteCode: normalized, updatedAt: Date.now() });
    return normalized;
  },
});

export const findByInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return null;
    const doc = await ctx.db
      .query("users")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", clean))
      .unique();
    if (!doc) return null;
    return {
      id: doc._id as string,
      fullName: doc.fullName,
      inviteCode: doc.inviteCode!,
    };
  },
});

export const countInvitesAccepted = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("users")
      .withIndex("by_invited_by", (q) => q.eq("invitedByUserId", userId))
      .collect();
    return rows.length;
  },
});

export const listRecentInvitees = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const rows = await ctx.db
      .query("users")
      .withIndex("by_invited_by", (q) => q.eq("invitedByUserId", userId))
      .collect();
    const lim = limit ?? 10;
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, lim)
      .map((r) => ({
        fullName: r.fullName,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
  },
});

/** Seed demo users if none exist (password hashes precomputed in Next.js or plain). */
export const seedDemoUsers = mutation({
  args: {
    users: v.array(
      v.object({
        fullName: v.string(),
        email: v.string(),
        phone: v.string(),
        passwordHash: v.string(),
        temple: v.string(),
        city: v.string(),
      })
    ),
  },
  handler: async (ctx, { users }) => {
    let created = 0;
    for (const u of users) {
      const email = u.email.toLowerCase();
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      if (existing) continue;
      const now = Date.now();
      await ctx.db.insert("users", {
        fullName: u.fullName,
        email,
        phone: u.phone,
        phoneDigits: digitsOnly(u.phone),
        passwordHash: u.passwordHash,
        temple: u.temple,
        city: u.city,
        country: "India",
        avatarUrl: null,
        inviteCode: null,
        invitedByUserId: null,
        createdAt: now,
        updatedAt: now,
      });
      created += 1;
    }
    return { created };
  },
});

export type { Id };
