import { query, type DbUser } from "@/lib/db";

const APP_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://sadhana-challenge-mu.vercel.app";

export function appBaseUrl(): string {
  return APP_BASE.replace(/\/$/, "").replace(/\/login\/?$/i, "");
}

/** Public join URL for a code */
export function inviteUrl(code: string): string {
  return `${appBaseUrl()}/join/${encodeURIComponent(code)}`;
}

/**
 * Build a short, URL-safe invite code from name + random suffix.
 * e.g. harsha-k7m2
 */
export function generateInviteCode(fullName: string): string {
  const slug = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug || "devotee"}-${suffix}`;
}

/** Ensure invite_code / invite columns exist (idempotent). */
export async function ensureInviteSchema(): Promise<void> {
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT;
  `);
  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id UUID
      REFERENCES users(id) ON DELETE SET NULL;
  `);
  // Unique index — ignore if already exists
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_invite_code_uidx
        ON users (invite_code) WHERE invite_code IS NOT NULL;
    `);
  } catch {
    /* already exists */
  }
}

/** Get or create a stable invite code for a user. */
export async function ensureUserInviteCode(userId: string): Promise<string> {
  await ensureInviteSchema();
  const existing = await query<{ invite_code: string | null; full_name: string }>(
    `SELECT invite_code, full_name FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = existing.rows[0];
  if (!row) throw new Error("User not found");
  if (row.invite_code) return row.invite_code;

  // Try a few codes in case of rare collision
  for (let i = 0; i < 6; i++) {
    const code = generateInviteCode(row.full_name || "devotee");
    try {
      const updated = await query<{ invite_code: string }>(
        `UPDATE users SET invite_code = $1, updated_at = NOW()
         WHERE id = $2 AND (invite_code IS NULL OR invite_code = '')
         RETURNING invite_code`,
        [code, userId]
      );
      if (updated.rows[0]?.invite_code) return updated.rows[0].invite_code;
      // Another request set it
      const again = await query<{ invite_code: string | null }>(
        `SELECT invite_code FROM users WHERE id = $1`,
        [userId]
      );
      if (again.rows[0]?.invite_code) return again.rows[0].invite_code;
    } catch {
      /* unique collision — retry */
    }
  }
  // Last resort: use id fragment
  const fallback = `user-${userId.replace(/-/g, "").slice(0, 10)}`;
  await query(`UPDATE users SET invite_code = $1 WHERE id = $2`, [
    fallback,
    userId,
  ]);
  return fallback;
}

export async function findUserByInviteCode(
  code: string
): Promise<{ id: string; fullName: string; inviteCode: string } | null> {
  await ensureInviteSchema();
  const clean = code.trim().toLowerCase();
  if (!clean) return null;
  const r = await query<{ id: string; full_name: string; invite_code: string }>(
    `SELECT id, full_name, invite_code FROM users
     WHERE lower(invite_code) = $1 LIMIT 1`,
    [clean]
  );
  const row = r.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    inviteCode: row.invite_code,
  };
}

export async function countInvitesAccepted(userId: string): Promise<number> {
  await ensureInviteSchema();
  const r = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM users WHERE invited_by_user_id = $1`,
    [userId]
  );
  return r.rows[0]?.n ?? 0;
}

export async function listRecentInvitees(
  userId: string,
  limit = 10
): Promise<{ fullName: string; createdAt: string }[]> {
  await ensureInviteSchema();
  const r = await query<{ full_name: string; created_at: Date | string }>(
    `SELECT full_name, created_at FROM users
     WHERE invited_by_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return r.rows.map((row) => ({
    fullName: row.full_name,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
  }));
}

export type { DbUser };
