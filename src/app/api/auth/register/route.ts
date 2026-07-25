import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  storePassword,
  normalizeIdentifier,
  toSessionUser,
} from "@/lib/auth";
import { isDatabaseError, query, type DbUser } from "@/lib/db";
import {
  ensureInviteSchema,
  ensureUserInviteCode,
  findUserByInviteCode,
} from "@/lib/invite";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      temple?: string;
      city?: string;
      country?: string;
      /** Invite code from /join/{code} or ?ref= */
      inviteRef?: string;
      ref?: string;
    };

    const fullName = (body.fullName || "").trim();
    const emailRaw = (body.email || "").trim();
    const phoneRaw = (body.phone || "").trim();
    const password = body.password || "";

    if (!fullName || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Name and password (min 6 chars) are required." },
        { status: 400 }
      );
    }
    if (!emailRaw && !phoneRaw) {
      return NextResponse.json(
        { error: "Provide email or phone number." },
        { status: 400 }
      );
    }

    const email = emailRaw
      ? normalizeIdentifier(emailRaw).value
      : null;
    const phone = phoneRaw
      ? normalizeIdentifier(phoneRaw).value
      : null;

    if (email) {
      const exists = await query(
        `SELECT id FROM users WHERE lower(email) = $1`,
        [email]
      );
      if (exists.rows.length) {
        return NextResponse.json(
          { error: "Email already registered." },
          { status: 409 }
        );
      }
    }
    if (phone) {
      const exists = await query(
        `SELECT id FROM users WHERE regexp_replace(COALESCE(phone,''), '\\D', '', 'g') = $1`,
        [phone]
      );
      if (exists.rows.length) {
        return NextResponse.json(
          { error: "Phone already registered." },
          { status: 409 }
        );
      }
    }

    await ensureInviteSchema();

    // Resolve optional inviter from invite code
    let invitedByUserId: string | null = null;
    const ref = (body.inviteRef || body.ref || "").trim();
    if (ref) {
      const inviter = await findUserByInviteCode(ref);
      if (inviter) invitedByUserId = inviter.id;
    }

    const password_hash = await storePassword(password);
    const inserted = await query<DbUser>(
      `INSERT INTO users (
         full_name, email, phone, password_hash, temple, city, country, invited_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        fullName,
        email,
        phone,
        password_hash,
        body.temple || "",
        body.city || "",
        body.country || "India",
        invitedByUserId,
      ]
    );

    const user = inserted.rows[0];
    // Give the new user their own invite code immediately
    try {
      await ensureUserInviteCode(user.id);
    } catch {
      /* non-fatal */
    }
    const session = toSessionUser(user);
    const token = await createSessionToken(session);
    const res = NextResponse.json({
      ok: true,
      user: session,
      invitedBy: invitedByUserId ? true : false,
    });
    res.cookies.set(AUTH_COOKIE, token, await cookieOptions());
    return res;
  } catch (e) {
    console.error("register error", e);
    if (isDatabaseError(e)) {
      return NextResponse.json(
        {
          error:
            "Database unavailable. Set DATABASE_URL (or DB_HOST/DB_*) on the host to a reachable Postgres — localhost only works on your machine.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
