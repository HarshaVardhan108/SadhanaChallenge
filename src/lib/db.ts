/**
 * Shared user shape used by auth / profile (backed by Convex, not Postgres).
 */

export type DbUser = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  temple: string | null;
  city: string | null;
  country: string | null;
  avatar_url?: string | null;
  invite_code?: string | null;
  invited_by_user_id?: string | null;
  created_at: Date | number | string;
};

/** True when a thrown error looks like a Convex / backend connectivity problem. */
export function isDatabaseError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Convex is not configured|NEXT_PUBLIC_CONVEX_URL|Failed to fetch|NetworkError|ECONNREFUSED|fetch failed|convex|unavailable|timeout/i.test(
    msg
  );
}
