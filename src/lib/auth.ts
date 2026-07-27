import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { DbUser } from "./db";
import { api, getConvexClient } from "./convex";

export const AUTH_COOKIE = "bhakti_session";

export type SessionUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  temple: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET || "bhakti-challenge-dev-secret";
  return new TextEncoder().encode(secret);
}

function isBcryptHash(stored: string) {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}

/** Hash password with bcrypt before storing. */
export async function storePassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against stored value.
 * Supports bcrypt hashes and legacy plain-text rows (demo seeds).
 */
export async function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (isBcryptHash(stored)) {
    return bcrypt.compare(password, stored);
  }
  return password === stored;
}

export async function createSessionToken(user: SessionUser) {
  const days = Number(process.env.AUTH_COOKIE_DAYS || 7);
  return new SignJWT({
    sub: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    temple: user.temple,
    city: user.city,
    country: user.country,
    avatarUrl: user.avatarUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

export async function readSessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: String(payload.sub),
      fullName: String(payload.fullName || ""),
      email: (payload.email as string) || null,
      phone: (payload.phone as string) || null,
      temple: (payload.temple as string) || null,
      city: (payload.city as string) || null,
      country: (payload.country as string) || null,
      avatarUrl: (payload.avatarUrl as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export function toSessionUser(row: DbUser): SessionUser {
  return {
    id: String(row.id),
    fullName: String(row.full_name || ""),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    temple: row.temple ? String(row.temple) : null,
    city: row.city ? String(row.city) : null,
    country: row.country ? String(row.country) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
  };
}

/** Map Convex PublicUser → DbUser */
export function convexUserToDbUser(u: {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  temple: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
  inviteCode?: string | null;
  invitedByUserId?: string | null;
  createdAt?: number;
  passwordHash: string;
}): DbUser {
  return {
    id: u.id,
    full_name: u.fullName,
    email: u.email,
    phone: u.phone,
    password_hash: u.passwordHash,
    temple: u.temple,
    city: u.city,
    country: u.country,
    avatar_url: u.avatarUrl,
    invite_code: u.inviteCode ?? null,
    invited_by_user_id: u.invitedByUserId ?? null,
    created_at: u.createdAt ? new Date(u.createdAt) : new Date(),
  };
}

/** Normalize login identifier: email or digits-only phone */
export function normalizeIdentifier(raw: string): {
  kind: "email" | "phone";
  value: string;
} {
  const v = raw.trim();
  if (v.includes("@")) {
    return { kind: "email", value: v.toLowerCase() };
  }
  const digits = v.replace(/\D/g, "");
  return { kind: "phone", value: digits };
}

export async function findUserByIdentifier(
  identifier: string
): Promise<DbUser | null> {
  const { kind, value } = normalizeIdentifier(identifier);
  if (!value) return null;

  const convex = getConvexClient();

  if (kind === "email") {
    const u = await convex.query(api.users.findByEmail, { email: value });
    return u ? convexUserToDbUser(u) : null;
  }

  const u = await convex.query(api.users.findByPhoneDigits, {
    phoneDigits: value,
  });
  return u ? convexUserToDbUser(u) : null;
}

export async function cookieOptions() {
  const days = Number(process.env.AUTH_COOKIE_DAYS || 7);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}
