/**
 * Server-side challenges repository (Convex).
 * Shared shapes with client `SavedChallenge` model.
 */
import type {
  ChallengeParticipant,
  ChallengeType,
  ChallengeVisibility,
  SavedChallenge,
} from "@/lib/challenges";
import { api, getConvexClient } from "@/lib/convex";

export async function dbListChallenges(opts?: {
  userId?: string | null;
  includePrivateForUser?: boolean;
}): Promise<SavedChallenge[]> {
  const convex = getConvexClient();
  const list = await convex.query(api.challenges.list, {
    userId: opts?.userId ?? null,
  });
  return (list || []) as SavedChallenge[];
}

export async function dbGetChallenge(
  id: string
): Promise<SavedChallenge | null> {
  const convex = getConvexClient();
  const challenge = await convex.query(api.challenges.getById, {
    challengeId: id,
  });
  return (challenge as SavedChallenge | null) ?? null;
}

export async function dbUpsertChallenge(
  challenge: SavedChallenge,
  createdByUserId?: string | null
): Promise<SavedChallenge> {
  const convex = getConvexClient();
  const saved = await convex.mutation(api.challenges.upsert, {
    challenge: {
      id: challenge.id,
      type: challenge.type === "shloka" ? "shloka" : "custom",
      name: challenge.name,
      days: challenge.days,
      visibility: challenge.visibility === "private" ? "private" : "public",
      createdAt: challenge.createdAt,
      createdBy: challenge.createdBy,
      goal: challenge.goal ?? null,
      activities: challenge.activities || [],
      activityLabels: challenge.activityLabels || [],
      bookId: challenge.bookId ?? null,
      bookName: challenge.bookName ?? null,
      chapterNumber: challenge.chapterNumber ?? null,
      shlokaIds: challenge.shlokaIds || [],
      shlokas: challenge.shlokas || [],
      invites: challenge.invites || [],
      participants: challenge.participants.map((p) => ({
        id: p.id,
        name: p.name,
        userId: p.userId ?? null,
        accepted: p.accepted !== false,
        completedDays: p.completedDays || [],
      })),
    },
    createdByUserId: createdByUserId ?? null,
  });
  return saved as SavedChallenge;
}

export async function dbUpdateParticipantDays(
  challengeId: string,
  participantId: string,
  completedDays: boolean[]
): Promise<SavedChallenge | null> {
  const convex = getConvexClient();
  const saved = await convex.mutation(api.challenges.updateParticipantDays, {
    challengeId,
    participantId,
    completedDays,
  });
  return (saved as SavedChallenge | null) ?? null;
}

export async function dbAddParticipant(
  challengeId: string,
  participant: ChallengeParticipant
): Promise<SavedChallenge | null> {
  const convex = getConvexClient();
  const saved = await convex.mutation(api.challenges.addParticipant, {
    challengeId,
    participant: {
      id: participant.id,
      name: participant.name,
      userId: participant.userId ?? null,
      accepted: participant.accepted !== false,
      completedDays: participant.completedDays || [],
    },
  });
  return (saved as SavedChallenge | null) ?? null;
}

export type { ChallengeType, ChallengeVisibility, SavedChallenge };
