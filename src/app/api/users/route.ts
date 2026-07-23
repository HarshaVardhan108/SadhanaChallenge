import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export type InviteUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  temple: string | null;
  city: string | null;
};

/**
 * List registered devotees for challenge invites (no passwords).
 * Requires a logged-in session; excludes the current user.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query<{
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      temple: string | null;
      city: string | null;
    }>(
      `SELECT id, full_name, email, phone, temple, city
       FROM users
       WHERE id::text <> $1
       ORDER BY lower(full_name) ASC, lower(COALESCE(email, '')) ASC
       LIMIT 200`,
      [session.id]
    );

    const users: InviteUser[] = result.rows.map((row) => ({
      id: row.id,
      fullName: (row.full_name || "").trim() || "Devotee",
      email: row.email,
      phone: row.phone,
      temple: row.temple,
      city: row.city,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users", err);
    return NextResponse.json(
      { error: "Could not load users. Is the database running?", users: [] },
      { status: 503 }
    );
  }
}
