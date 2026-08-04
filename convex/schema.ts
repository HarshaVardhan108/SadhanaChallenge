import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Sadhana Challenge data model (migrated from PostgreSQL).
 * Auth sessions stay in Next.js (JWT cookies); users + app data live here.
 */
export default defineSchema({
  users: defineTable({
    fullName: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    phone: v.optional(v.union(v.string(), v.null())),
    /** Digits-only phone for lookup */
    phoneDigits: v.optional(v.union(v.string(), v.null())),
    passwordHash: v.string(),
    temple: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    country: v.optional(v.union(v.string(), v.null())),
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    inviteCode: v.optional(v.union(v.string(), v.null())),
    invitedByUserId: v.optional(v.union(v.id("users"), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone_digits", ["phoneDigits"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_invited_by", ["invitedByUserId"]),

  challenges: defineTable({
    /** Client-facing challenge id (e.g. ch-xxx) — not the Convex _id */
    challengeId: v.string(),
    type: v.union(v.literal("custom"), v.literal("shloka")),
    name: v.string(),
    days: v.number(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    createdAt: v.string(),
    createdByUserId: v.optional(v.union(v.id("users"), v.null())),
    createdByName: v.string(),
    goal: v.optional(v.union(v.string(), v.null())),
    activities: v.array(v.string()),
    activityLabels: v.array(v.string()),
    bookId: v.optional(v.union(v.string(), v.null())),
    bookName: v.optional(v.union(v.string(), v.null())),
    chapterNumber: v.optional(v.union(v.number(), v.null())),
    shlokaIds: v.array(v.string()),
    shlokas: v.array(v.string()),
    invites: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_challenge_id", ["challengeId"])
    .index("by_visibility", ["visibility"])
    .index("by_created_by", ["createdByUserId"]),

  challengeParticipants: defineTable({
    /** Client-facing participant id */
    participantId: v.string(),
    challengeId: v.string(),
    userId: v.optional(v.union(v.id("users"), v.null())),
    name: v.string(),
    accepted: v.boolean(),
    completedDays: v.array(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_participant_id", ["participantId"])
    .index("by_user", ["userId"]),

  dailyStreaks: defineTable({
    userId: v.id("users"),
    completedDates: v.array(v.string()),
    bestStreak: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userShlokaCompletions: defineTable({
    userId: v.id("users"),
    shlokaId: v.string(),
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_shloka", ["userId", "shlokaId"]),

  userSettings: defineTable({
    userId: v.id("users"),
    spiritualName: v.string(),
    dailyRounds: v.number(),
    readingMinutes: v.number(),
    fluteAmbient: v.boolean(),
    /** Target study hours per day */
    studyHoursDay: v.optional(v.number()),
    /** Target study hours per week */
    studyHoursWeek: v.optional(v.number()),
    /** Target study hours per month */
    studyHoursMonth: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /** Daily study hours logged by the student */
  studyHoursLogs: defineTable({
    userId: v.id("users"),
    /** Local calendar day YYYY-MM-DD */
    date: v.string(),
    hours: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  pushSubscriptions: defineTable({
    userId: v.optional(v.union(v.id("users"), v.null())),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    enabled: v.boolean(),
    timezone: v.string(),
    hour: v.number(),
    lastSentDate: v.optional(v.union(v.string(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_endpoint", ["endpoint"])
    .index("by_enabled", ["enabled"]),
});
