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

/** Force Node.js runtime (pg + bcrypt need Node, not Edge). */
export const runtime = "nodejs";

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

    const stored =
      user.password_hash == null ? "" : String(user.password_hash);
    const ok = await verifyPassword(password, stored);
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
      delete (opts as { maxAge?: number }).maxAge;
    }

    const res = NextResponse.json({
      ok: true,
      user: session,
    });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      ...(opts.maxAge != null ? { maxAge: opts.maxAge } : {}),
    });
    return res;
  } catch (e) {
    console.error("login error", e);
    const detail = e instanceof Error ? e.message : String(e);
    if (isDatabaseError(e)) {
      return NextResponse.json(
        {
          error:
            "Database unavailable. Check DATABASE_URL on Vercel points to Neon (not localhost).",
          detail,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Login failed. Please try again.", detail },
      { status: 500 }
    );
  }
}
