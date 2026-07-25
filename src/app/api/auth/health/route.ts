import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/auth/health — diagnose production DB + auth (no secrets returned).
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL
  );
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);

  let dbOk = false;
  let userCount: number | null = null;
  let demoUser = false;
  let dbError: string | null = null;
  let jwtOk = false;
  let jwtError: string | null = null;

  try {
    const r = await query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM users`);
    userCount = Number(r.rows[0]?.n ?? 0);
    dbOk = true;
    const demo = await query<{ email: string }>(
      `SELECT email FROM users WHERE lower(email) = $1 LIMIT 1`,
      ["harsha@example.com"]
    );
    demoUser = demo.rows.length > 0;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  try {
    await createSessionToken({
      id: "00000000-0000-0000-0000-000000000001",
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

  const ok = dbOk && jwtOk && demoUser;
  return NextResponse.json(
    {
      ok,
      hasDatabaseUrl,
      hasAuthSecret,
      dbOk,
      userCount,
      demoUser,
      dbError,
      jwtOk,
      jwtError,
      nodeEnv: process.env.NODE_ENV,
      runtime: "nodejs",
    },
    { status: ok ? 200 : 503 }
  );
}
