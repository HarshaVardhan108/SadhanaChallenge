import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  getSession,
  toSessionUser,
  convexUserToDbUser,
  type SessionUser,
} from "@/lib/auth";
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * PATCH /api/profile
 * Update the logged-in user's profile fields.
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

    const convex = getConvexClient();

    if (email) {
      const clash = await convex.query(api.users.findByEmail, { email });
      if (clash && clash.id !== session.id) {
        return NextResponse.json(
          { error: "That email is already used by another account." },
          { status: 409 }
        );
      }
    }

    const row = await convex.mutation(api.users.updateProfile, {
      id: session.id as Id<"users">,
      fullName,
      email,
      phone,
      temple,
      city,
      country,
    });

    const nextUser: SessionUser = toSessionUser(convexUserToDbUser(row));
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
    if (msg.includes("EMAIL_EXISTS") || msg.includes("unique")) {
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
