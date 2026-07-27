import type { DbUser } from "@/lib/db";
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../convex/_generated/dataModel";

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

/** Get or create a stable invite code for a user. */
export async function ensureUserInviteCode(userId: string): Promise<string> {
  const convex = getConvexClient();
  const user = await convex.query(api.users.getById, {
    id: userId as Id<"users">,
  });
  if (!user) throw new Error("User not found");
  if (user.inviteCode) return user.inviteCode;

  for (let i = 0; i < 6; i++) {
    const code = generateInviteCode(user.fullName || "devotee");
    try {
      return await convex.mutation(api.users.ensureInviteCode, {
        id: userId as Id<"users">,
        code,
      });
    } catch {
      /* collision — retry */
    }
  }

  const fallback = `user-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
  return await convex.mutation(api.users.ensureInviteCode, {
    id: userId as Id<"users">,
    code: fallback,
  });
}

export async function findUserByInviteCode(
  code: string
): Promise<{ id: string; fullName: string; inviteCode: string } | null> {
  const convex = getConvexClient();
  return await convex.query(api.users.findByInviteCode, { code });
}

export async function countInvitesAccepted(userId: string): Promise<number> {
  const convex = getConvexClient();
  return await convex.query(api.users.countInvitesAccepted, {
    userId: userId as Id<"users">,
  });
}

export async function listRecentInvitees(
  userId: string,
  limit = 10
): Promise<{ fullName: string; createdAt: string }[]> {
  const convex = getConvexClient();
  return await convex.query(api.users.listRecentInvitees, {
    userId: userId as Id<"users">,
    limit,
  });
}

export type { DbUser };
