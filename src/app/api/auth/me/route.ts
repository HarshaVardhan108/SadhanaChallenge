import { NextResponse } from "next/server";
import { getSession, toSessionUser } from "@/lib/auth";
import { query, type DbUser } from "@/lib/db";

/** Return the current session user, refreshed from the database when possible. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const r = await query<DbUser>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [session.id]
    );
    const row = r.rows[0];
    if (row) {
      const user = toSessionUser(row);
      if (!user.avatarUrl && session.avatarUrl) {
        user.avatarUrl = session.avatarUrl;
      }
      return NextResponse.json({ user });
    }
  } catch {
    /* fall through to JWT session */
  }

  return NextResponse.json({ user: session });
}
