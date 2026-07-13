import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query, type DbUser } from "./db";

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

/** Store password as plain text (column name remains password_hash). */
export function storePassword(password: string) {
  return password;
}

/** Plain-text password check (no hashing). */
export function verifyPassword(password: string, stored: string) {
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
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    temple: row.temple,
    city: row.city,
    country: row.country,
    avatarUrl: row.avatar_url ?? null,
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

  if (kind === "email") {
    const r = await query<DbUser>(
      `SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`,
      [value]
    );
    return r.rows[0] ?? null;
  }

  // Match phone with or without country code tails
  const r = await query<DbUser>(
    `SELECT * FROM users
     WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
        OR regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') LIKE $2
     LIMIT 1`,
    [value, `%${value.slice(-10)}`]
  );
  return r.rows[0] ?? null;
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
