import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  storePassword,
  normalizeIdentifier,
  toSessionUser,
} from "@/lib/auth";
import { query, type DbUser } from "@/lib/db";

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

    const password_hash = storePassword(password);
    const inserted = await query<DbUser>(
      `INSERT INTO users (full_name, email, phone, password_hash, temple, city, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        fullName,
        email,
        phone,
        password_hash,
        body.temple || "",
        body.city || "",
        body.country || "India",
      ]
    );

    const user = inserted.rows[0];
    const session = toSessionUser(user);
    const token = await createSessionToken(session);
    const res = NextResponse.json({ ok: true, user: session });
    res.cookies.set(AUTH_COOKIE, token, await cookieOptions());
    return res;
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
