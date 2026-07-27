import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  storePassword,
  normalizeIdentifier,
  toSessionUser,
  convexUserToDbUser,
} from "@/lib/auth";
import { isDatabaseError } from "@/lib/db";
import { api, getConvexClient } from "@/lib/convex";
import {
  ensureUserInviteCode,
  findUserByInviteCode,
} from "@/lib/invite";
import type { Id } from "../../../../../convex/_generated/dataModel";

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

    const email = emailRaw ? normalizeIdentifier(emailRaw).value : null;
    const phone = phoneRaw ? normalizeIdentifier(phoneRaw).value : null;

    const convex = getConvexClient();

    if (email) {
      const exists = await convex.query(api.users.findByEmail, { email });
      if (exists) {
        return NextResponse.json(
          { error: "Email already registered." },
          { status: 409 }
        );
      }
    }
    if (phone) {
      const exists = await convex.query(api.users.findByPhoneDigits, {
        phoneDigits: phone,
      });
      if (exists) {
        return NextResponse.json(
          { error: "Phone already registered." },
          { status: 409 }
        );
      }
    }

    let invitedByUserId: Id<"users"> | null = null;
    const ref = (body.inviteRef || body.ref || "").trim();
    if (ref) {
      const inviter = await findUserByInviteCode(ref);
      if (inviter) invitedByUserId = inviter.id as Id<"users">;
    }

    const passwordHash = await storePassword(password);
    const user = await convex.mutation(api.users.register, {
      fullName,
      email,
      phone,
      passwordHash,
      temple: body.temple || "",
      city: body.city || "",
      country: body.country || "India",
      invitedByUserId,
    });

    try {
      await ensureUserInviteCode(user.id);
    } catch {
      /* non-fatal */
    }

    const session = toSessionUser(convexUserToDbUser(user));
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
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("EMAIL_EXISTS")) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }
    if (msg.includes("PHONE_EXISTS")) {
      return NextResponse.json(
        { error: "Phone already registered." },
        { status: 409 }
      );
    }
    if (isDatabaseError(e)) {
      return NextResponse.json(
        {
          error:
            "Convex unavailable. Set NEXT_PUBLIC_CONVEX_URL (run `npx convex dev`).",
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
