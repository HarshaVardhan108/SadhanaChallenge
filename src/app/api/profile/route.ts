import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  getSession,
  toSessionUser,
  type SessionUser,
} from "@/lib/auth";
import { query, type DbUser } from "@/lib/db";

/**
 * PATCH /api/profile
 * Update the logged-in user's profile fields (name, email, temple, city, country).
 * Refreshes the session cookie so /api/auth/me and the UI stay in sync.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const body = (await req.json()) as {
      fullName?: string;
      email?: string | null;
      phone?: string | null;
      temple?: string | null;
      city?: string | null;
      country?: string | null;
    };

    const fullName = (body.fullName ?? session.fullName ?? "").trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "Display name is required." },
        { status: 400 }
      );
    }

    const emailRaw = body.email !== undefined ? body.email : session.email;
    const email =
      emailRaw == null || String(emailRaw).trim() === ""
        ? null
        : String(emailRaw).trim().toLowerCase();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const temple =
      body.temple !== undefined
        ? String(body.temple || "").trim() || null
        : session.temple;
    const city =
      body.city !== undefined
        ? String(body.city || "").trim() || null
        : session.city;
    const country =
      body.country !== undefined
        ? String(body.country || "").trim() || null
        : session.country;
    const phone =
      body.phone !== undefined
        ? String(body.phone || "").trim() || null
        : session.phone;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Keep at least an email or phone on your account." },
        { status: 400 }
      );
    }

    // Unique email check (other users)
    if (email) {
      const clash = await query<{ id: string }>(
        `SELECT id FROM users WHERE lower(email) = $1 AND id <> $2 LIMIT 1`,
        [email, session.id]
      );
      if (clash.rows[0]) {
        return NextResponse.json(
          { error: "That email is already used by another account." },
          { status: 409 }
        );
      }
    }

    const updated = await query<DbUser>(
      `UPDATE users
       SET full_name = $1,
           email = $2,
           phone = COALESCE($3, phone),
           temple = $4,
           city = $5,
           country = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [fullName, email, phone, temple, city, country, session.id]
    );

    const row = updated.rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const nextUser: SessionUser = toSessionUser(row);
    // Preserve avatar from session if DB column empty mid-migration
    if (!nextUser.avatarUrl && session.avatarUrl) {
      nextUser.avatarUrl = session.avatarUrl;
    }

    const token = await createSessionToken(nextUser);
    const opts = await cookieOptions();
    const res = NextResponse.json({ ok: true, user: nextUser });
    res.cookies.set(AUTH_COOKIE, token, opts);
    return res;
  } catch (e) {
    console.error("profile update error", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "Email or phone is already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not update profile. Please try again." },
      { status: 500 }
    );
  }
}
