/**
 * Server-side challenges repository (PostgreSQL).
 * Shared shapes with client `SavedChallenge` model.
 */
import { query } from "@/lib/db";
import type {
  ChallengeParticipant,
  ChallengeType,
  ChallengeVisibility,
  SavedChallenge,
} from "@/lib/challenges";

type ChallengeRow = {
  id: string;
  type: string;
  name: string;
  days: number;
  visibility: string;
  created_at: Date | string;
  created_by_user_id: string | null;
  created_by_name: string;
  goal: string | null;
  activities: unknown;
  activity_labels: unknown;
  book_id: string | null;
  book_name: string | null;
  chapter_number: number | null;
  shloka_ids: unknown;
  shlokas: unknown;
  invites: unknown;
};

type ParticipantRow = {
  id: string;
  challenge_id: string;
  user_id: string | null;
  name: string;
  accepted: boolean;
  completed_days: unknown;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String);
}

function asBoolArray(v: unknown, days: number): boolean[] {
  const raw = Array.isArray(v) ? v : [];
  return Array.from({ length: Math.max(1, days) }, (_, i) => Boolean(raw[i]));
}

function iso(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString();
}

function mapParticipant(row: ParticipantRow, days: number): ChallengeParticipant {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id || undefined,
    accepted: row.accepted !== false,
    completedDays: asBoolArray(row.completed_days, days),
  };
}

function mapChallenge(
  row: ChallengeRow,
  participants: ChallengeParticipant[]
): SavedChallenge {
  return {
    id: row.id,
    type: row.type === "shloka" ? "shloka" : "custom",
    name: row.name,
    days: Number(row.days) || 7,
    visibility: row.visibility === "private" ? "private" : "public",
    createdAt: iso(row.created_at),
    createdBy: row.created_by_name || "Devotee",
    goal: row.goal || undefined,
    activities: asStringArray(row.activities),
    activityLabels: asStringArray(row.activity_labels),
    bookId: row.book_id || undefined,
    bookName: row.book_name || undefined,
    chapterNumber:
      row.chapter_number != null ? Number(row.chapter_number) : undefined,
    shlokaIds: asStringArray(row.shloka_ids),
    shlokas: asStringArray(row.shlokas),
    invites: asStringArray(row.invites),
    participants,
  };
}

async function loadParticipants(
  challengeIds: string[]
): Promise<Map<string, ChallengeParticipant[]>> {
  const map = new Map<string, ChallengeParticipant[]>();
  if (challengeIds.length === 0) return map;

  const r = await query<ParticipantRow>(
    `SELECT id, challenge_id, user_id, name, accepted, completed_days
     FROM challenge_participants
     WHERE challenge_id = ANY($1::text[])
     ORDER BY created_at ASC`,
    [challengeIds]
  );

  // Need days per challenge — load from challenges if needed via separate map
  const daysR = await query<{ id: string; days: number }>(
    `SELECT id, days FROM challenges WHERE id = ANY($1::text[])`,
    [challengeIds]
  );
  const daysMap = new Map(daysR.rows.map((x) => [x.id, Number(x.days) || 7]));

  for (const row of r.rows) {
    const days = daysMap.get(row.challenge_id) ?? 7;
    const list = map.get(row.challenge_id) ?? [];
    list.push(mapParticipant(row, days));
    map.set(row.challenge_id, list);
  }
  return map;
}

export async function dbListChallenges(opts?: {
  userId?: string | null;
  /** When true, include private challenges for this user only */
  includePrivateForUser?: boolean;
}): Promise<SavedChallenge[]> {
  const userId = opts?.userId || null;

  let rows: ChallengeRow[];
  if (userId) {
    const r = await query<ChallengeRow>(
      `SELECT DISTINCT c.*
       FROM challenges c
       LEFT JOIN challenge_participants p ON p.challenge_id = c.id
       WHERE c.visibility = 'public'
          OR c.created_by_user_id = $1
          OR p.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    rows = r.rows;
  } else {
    const r = await query<ChallengeRow>(
      `SELECT * FROM challenges WHERE visibility = 'public' ORDER BY created_at DESC`
    );
    rows = r.rows;
  }

  const ids = rows.map((x) => x.id);
  const pmap = await loadParticipants(ids);
  return rows.map((row) => mapChallenge(row, pmap.get(row.id) ?? []));
}

export async function dbGetChallenge(
  id: string
): Promise<SavedChallenge | null> {
  const r = await query<ChallengeRow>(
    `SELECT * FROM challenges WHERE id = $1 LIMIT 1`,
    [id]
  );
  const row = r.rows[0];
  if (!row) return null;
  const pmap = await loadParticipants([id]);
  return mapChallenge(row, pmap.get(id) ?? []);
}

export async function dbUpsertChallenge(
  challenge: SavedChallenge,
  createdByUserId?: string | null
): Promise<SavedChallenge> {
  await query(
    `INSERT INTO challenges (
      id, type, name, days, visibility, created_at, created_by_user_id,
      created_by_name, goal, activities, activity_labels, book_id, book_name,
      chapter_number, shloka_ids, shlokas, invites, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,
      $15::jsonb,$16::jsonb,$17::jsonb,NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      type = EXCLUDED.type,
      name = EXCLUDED.name,
      days = EXCLUDED.days,
      visibility = EXCLUDED.visibility,
      created_by_user_id = COALESCE(EXCLUDED.created_by_user_id, challenges.created_by_user_id),
      created_by_name = EXCLUDED.created_by_name,
      goal = EXCLUDED.goal,
      activities = EXCLUDED.activities,
      activity_labels = EXCLUDED.activity_labels,
      book_id = EXCLUDED.book_id,
      book_name = EXCLUDED.book_name,
      chapter_number = EXCLUDED.chapter_number,
      shloka_ids = EXCLUDED.shloka_ids,
      shlokas = EXCLUDED.shlokas,
      invites = EXCLUDED.invites,
      updated_at = NOW()`,
    [
      challenge.id,
      challenge.type,
      challenge.name,
      challenge.days,
      challenge.visibility,
      challenge.createdAt,
      createdByUserId || null,
      challenge.createdBy,
      challenge.goal || null,
      JSON.stringify(challenge.activities || []),
      JSON.stringify(challenge.activityLabels || []),
      challenge.bookId || null,
      challenge.bookName || null,
      challenge.chapterNumber ?? null,
      JSON.stringify(challenge.shlokaIds || []),
      JSON.stringify(challenge.shlokas || []),
      JSON.stringify(challenge.invites || []),
    ]
  );

  // Replace participants set
  await query(`DELETE FROM challenge_participants WHERE challenge_id = $1`, [
    challenge.id,
  ]);

  for (const p of challenge.participants) {
    await query(
      `INSERT INTO challenge_participants
        (id, challenge_id, user_id, name, accepted, completed_days, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,NOW())`,
      [
        p.id,
        challenge.id,
        p.userId || null,
        p.name,
        p.accepted !== false,
        JSON.stringify(p.completedDays || []),
      ]
    );
  }

  return (await dbGetChallenge(challenge.id))!;
}

export async function dbUpdateParticipantDays(
  challengeId: string,
  participantId: string,
  completedDays: boolean[]
): Promise<SavedChallenge | null> {
  await query(
    `UPDATE challenge_participants
     SET completed_days = $1::jsonb, updated_at = NOW()
     WHERE challenge_id = $2 AND id = $3`,
    [JSON.stringify(completedDays), challengeId, participantId]
  );
  return dbGetChallenge(challengeId);
}

export async function dbAddParticipant(
  challengeId: string,
  participant: ChallengeParticipant
): Promise<SavedChallenge | null> {
  await query(
    `INSERT INTO challenge_participants
      (id, challenge_id, user_id, name, accepted, completed_days, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,NOW())
     ON CONFLICT (id) DO UPDATE SET
       user_id = COALESCE(EXCLUDED.user_id, challenge_participants.user_id),
       name = EXCLUDED.name,
       accepted = EXCLUDED.accepted,
       completed_days = EXCLUDED.completed_days,
       updated_at = NOW()`,
    [
      participant.id,
      challengeId,
      participant.userId || null,
      participant.name,
      participant.accepted !== false,
      JSON.stringify(participant.completedDays || []),
    ]
  );
  return dbGetChallenge(challengeId);
}

export type { ChallengeType, ChallengeVisibility, SavedChallenge };
