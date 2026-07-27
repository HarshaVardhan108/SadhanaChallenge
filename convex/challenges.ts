import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const participantValidator = v.object({
  id: v.string(),
  name: v.string(),
  userId: v.optional(v.union(v.string(), v.null())),
  accepted: v.optional(v.boolean()),
  completedDays: v.array(v.boolean()),
});

const challengeValidator = v.object({
  id: v.string(),
  type: v.union(v.literal("custom"), v.literal("shloka")),
  name: v.string(),
  days: v.number(),
  visibility: v.union(v.literal("public"), v.literal("private")),
  createdAt: v.string(),
  createdBy: v.string(),
  goal: v.optional(v.union(v.string(), v.null())),
  activities: v.optional(v.array(v.string())),
  activityLabels: v.optional(v.array(v.string())),
  bookId: v.optional(v.union(v.string(), v.null())),
  bookName: v.optional(v.union(v.string(), v.null())),
  chapterNumber: v.optional(v.union(v.number(), v.null())),
  shlokaIds: v.optional(v.array(v.string())),
  shlokas: v.optional(v.array(v.string())),
  invites: v.optional(v.array(v.string())),
  participants: v.array(participantValidator),
});

type SavedChallenge = {
  id: string;
  type: "custom" | "shloka";
  name: string;
  days: number;
  visibility: "public" | "private";
  createdAt: string;
  createdBy: string;
  goal?: string;
  activities?: string[];
  activityLabels?: string[];
  bookId?: string;
  bookName?: string;
  chapterNumber?: number;
  shlokaIds?: string[];
  shlokas?: string[];
  invites?: string[];
  participants: {
    id: string;
    name: string;
    userId?: string;
    accepted?: boolean;
    completedDays: boolean[];
  }[];
};

async function assembleChallenge(
  ctx: { db: any },
  challengeId: string
): Promise<SavedChallenge | null> {
  const row = await ctx.db
    .query("challenges")
    .withIndex("by_challenge_id", (q: any) => q.eq("challengeId", challengeId))
    .unique();
  if (!row) return null;

  const parts = await ctx.db
    .query("challengeParticipants")
    .withIndex("by_challenge", (q: any) => q.eq("challengeId", challengeId))
    .collect();

  const days = Number(row.days) || 7;
  const participants = parts.map((p: any) => ({
    id: p.participantId,
    name: p.name,
    userId: p.userId ? String(p.userId) : undefined,
    accepted: p.accepted !== false,
    completedDays: Array.from({ length: days }, (_, i) =>
      Boolean(p.completedDays?.[i])
    ),
  }));

  return {
    id: row.challengeId,
    type: row.type === "shloka" ? "shloka" : "custom",
    name: row.name,
    days,
    visibility: row.visibility === "private" ? "private" : "public",
    createdAt: row.createdAt,
    createdBy: row.createdByName || "Devotee",
    goal: row.goal || undefined,
    activities: row.activities || [],
    activityLabels: row.activityLabels || [],
    bookId: row.bookId || undefined,
    bookName: row.bookName || undefined,
    chapterNumber:
      row.chapterNumber != null ? Number(row.chapterNumber) : undefined,
    shlokaIds: row.shlokaIds || [],
    shlokas: row.shlokas || [],
    invites: row.invites || [],
    participants,
  };
}

export const list = query({
  args: {
    userId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db.query("challenges").collect();
    let filtered = all;

    if (userId) {
      const allParts = await ctx.db.query("challengeParticipants").collect();
      const joinedIds = new Set(
        allParts
          .filter((p) => p.userId && String(p.userId) === userId)
          .map((p) => p.challengeId)
      );
      filtered = all.filter(
        (c) =>
          c.visibility === "public" ||
          (c.createdByUserId && String(c.createdByUserId) === userId) ||
          joinedIds.has(c.challengeId)
      );
    } else {
      filtered = all.filter((c) => c.visibility === "public");
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const result: SavedChallenge[] = [];
    for (const c of filtered) {
      const assembled = await assembleChallenge(ctx, c.challengeId);
      if (assembled) result.push(assembled);
    }
    return result;
  },
});

export const getById = query({
  args: { challengeId: v.string() },
  handler: async (ctx, { challengeId }) => {
    return assembleChallenge(ctx, challengeId);
  },
});

export const upsert = mutation({
  args: {
    challenge: challengeValidator,
    createdByUserId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { challenge, createdByUserId }) => {
    const existing = await ctx.db
      .query("challenges")
      .withIndex("by_challenge_id", (q) => q.eq("challengeId", challenge.id))
      .unique();

    const createdByUserIdVal =
      (createdByUserId as Id<"users"> | null | undefined) ||
      existing?.createdByUserId ||
      null;

    const payload = {
      challengeId: challenge.id,
      type: challenge.type,
      name: challenge.name,
      days: challenge.days,
      visibility: challenge.visibility,
      createdAt: challenge.createdAt,
      createdByUserId: createdByUserIdVal,
      createdByName: challenge.createdBy || "Devotee",
      goal: challenge.goal ?? null,
      activities: challenge.activities || [],
      activityLabels: challenge.activityLabels || [],
      bookId: challenge.bookId ?? null,
      bookName: challenge.bookName ?? null,
      chapterNumber: challenge.chapterNumber ?? null,
      shlokaIds: challenge.shlokaIds || [],
      shlokas: challenge.shlokas || [],
      invites: challenge.invites || [],
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("challenges", payload);
    }

    // Replace participants
    const oldParts = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge.id))
      .collect();
    for (const p of oldParts) {
      await ctx.db.delete(p._id);
    }

    const now = Date.now();
    for (const p of challenge.participants) {
      await ctx.db.insert("challengeParticipants", {
        participantId: p.id,
        challengeId: challenge.id,
        userId: (p.userId as Id<"users"> | undefined) || null,
        name: p.name,
        accepted: p.accepted !== false,
        completedDays: p.completedDays || [],
        createdAt: now,
        updatedAt: now,
      });
    }

    return assembleChallenge(ctx, challenge.id);
  },
});

export const updateParticipantDays = mutation({
  args: {
    challengeId: v.string(),
    participantId: v.string(),
    completedDays: v.array(v.boolean()),
  },
  handler: async (ctx, { challengeId, participantId, completedDays }) => {
    const parts = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .collect();
    const p = parts.find((x) => x.participantId === participantId);
    if (!p) return null;
    await ctx.db.patch(p._id, {
      completedDays,
      updatedAt: Date.now(),
    });
    return assembleChallenge(ctx, challengeId);
  },
});

export const addParticipant = mutation({
  args: {
    challengeId: v.string(),
    participant: participantValidator,
  },
  handler: async (ctx, { challengeId, participant }) => {
    const existing = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_participant_id", (q) =>
        q.eq("participantId", participant.id)
      )
      .unique();

    const now = Date.now();
    const row = {
      participantId: participant.id,
      challengeId,
      userId: (participant.userId as Id<"users"> | undefined) || null,
      name: participant.name,
      accepted: participant.accepted !== false,
      completedDays: participant.completedDays || [],
      createdAt: now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: row.userId || existing.userId,
        name: row.name,
        accepted: row.accepted,
        completedDays: row.completedDays,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("challengeParticipants", row);
    }

    return assembleChallenge(ctx, challengeId);
  },
});

export const userHasAnyChallenges = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const created = await ctx.db.query("challenges").collect();
    if (created.some((c) => c.createdByUserId && String(c.createdByUserId) === userId)) {
      return true;
    }
    const parts = await ctx.db.query("challengeParticipants").collect();
    return parts.some(
      (p) => p.accepted && p.userId && String(p.userId) === userId
    );
  },
});
