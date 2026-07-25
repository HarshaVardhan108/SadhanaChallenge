import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  findUserByIdentifier,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { isDatabaseError } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      identifier?: string;
      password?: string;
      remember?: boolean;
    };

    const identifier = (body.identifier || "").trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/phone and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/phone or password." },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email/phone or password." },
        { status: 401 }
      );
    }

    const session = toSessionUser(user);
    const token = await createSessionToken(session);
    const opts = await cookieOptions();
    if (body.remember === false) {
      opts.maxAge = undefined as unknown as number;
      // session cookie when not remembered
      delete (opts as { maxAge?: number }).maxAge;
    }

    const res = NextResponse.json({
      ok: true,
      user: session,
    });
    res.cookies.set(AUTH_COOKIE, token, opts);
    return res;
  } catch (e) {
    console.error("login error", e);
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
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
