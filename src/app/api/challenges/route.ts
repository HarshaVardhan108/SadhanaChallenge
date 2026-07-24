import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  dbListChallenges,
  dbUpsertChallenge,
} from "@/lib/challenges-db";
import type { SavedChallenge } from "@/lib/challenges";

/** GET /api/challenges — public + user's private/joined challenges */
export async function GET() {
  try {
    const session = await getSession();
    const list = await dbListChallenges({
      userId: session?.id ?? null,
      includePrivateForUser: Boolean(session?.id),
    });
    return NextResponse.json({ ok: true, challenges: list });
  } catch (e) {
    console.error("GET /api/challenges", e);
    return NextResponse.json(
      { ok: false, error: "Failed to load challenges.", challenges: [] },
      { status: 500 }
    );
  }
}

/** POST /api/challenges — create or upsert a challenge (logged-in) */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const body = (await req.json()) as { challenge?: SavedChallenge };
    if (!body.challenge?.id || !body.challenge.name) {
      return NextResponse.json(
        { error: "Invalid challenge payload." },
        { status: 400 }
      );
    }

    const challenge = body.challenge;
    // Ensure creator name/user on participants if missing
    if (!challenge.createdBy) {
      challenge.createdBy = session.fullName;
    }

    const saved = await dbUpsertChallenge(challenge, session.id);
    return NextResponse.json({ ok: true, challenge: saved });
  } catch (e) {
    console.error("POST /api/challenges", e);
    return NextResponse.json(
      { error: "Failed to save challenge." },
      { status: 500 }
    );
  }
}
