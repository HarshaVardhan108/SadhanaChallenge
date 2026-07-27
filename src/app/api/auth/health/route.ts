import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { api, getConvexClient, getConvexUrl } from "@/lib/convex";

export const runtime = "nodejs";

/**
 * GET /api/auth/health — diagnose Convex + auth (no secrets returned).
 */
export async function GET() {
  const hasConvexUrl = Boolean(getConvexUrl());
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);

  let convexOk = false;
  let userCount: number | null = null;
  let demoUser = false;
  let convexError: string | null = null;
  let jwtOk = false;
  let jwtError: string | null = null;

  try {
    const convex = getConvexClient();
    userCount = await convex.query(api.users.countUsers, {});
    convexOk = true;
    const demo = await convex.query(api.users.findByEmail, {
      email: "harsha@example.com",
    });
    demoUser = Boolean(demo);
  } catch (e) {
    convexError = e instanceof Error ? e.message : String(e);
  }

  try {
    await createSessionToken({
      id: "health-check-user",
      fullName: "Health Check",
      email: "health@example.com",
      phone: null,
      temple: null,
      city: null,
      country: null,
      avatarUrl: null,
    });
    jwtOk = true;
  } catch (e) {
    jwtError = e instanceof Error ? e.message : String(e);
  }

  const ok = convexOk && jwtOk;
  return NextResponse.json(
    {
      ok,
      hasConvexUrl,
      hasAuthSecret,
      convexOk,
      userCount,
      demoUser,
      convexError,
      jwtOk,
      jwtError,
      nodeEnv: process.env.NODE_ENV,
      runtime: "nodejs",
      backend: "convex",
    },
    { status: ok ? 200 : 503 }
  );
}
