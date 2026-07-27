import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../../../convex/_generated/dataModel";

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
    const convex = getConvexClient();
    const users = (await convex.query(api.users.listForInvites, {
      excludeUserId: session.id as Id<"users">,
    })) as InviteUser[];

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users", err);
    return NextResponse.json(
      { error: "Could not load users. Is Convex configured?", users: [] },
      { status: 503 }
    );
  }
}
