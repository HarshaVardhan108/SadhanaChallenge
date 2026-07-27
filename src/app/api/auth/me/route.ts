import { NextResponse } from "next/server";
import {
  getSession,
  toSessionUser,
  convexUserToDbUser,
} from "@/lib/auth";
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** Return the current session user, refreshed from Convex when possible. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const convex = getConvexClient();
    const row = await convex.query(api.users.getById, {
      id: session.id as Id<"users">,
    });
    if (row) {
      const user = toSessionUser(convexUserToDbUser(row));
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
