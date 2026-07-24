import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  dbAddParticipant,
  dbGetChallenge,
  dbUpdateParticipantDays,
  dbUpsertChallenge,
} from "@/lib/challenges-db";
import {
  createParticipant,
  type SavedChallenge,
} from "@/lib/challenges";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/challenges/:id */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const challenge = await dbGetChallenge(id);
    if (!challenge) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Private: only creator or participant
    if (challenge.visibility === "private") {
      const session = await getSession();
      const allowed =
        session &&
        (challenge.participants.some((p) => p.userId === session.id) ||
          challenge.createdBy
            .toLowerCase()
            .includes(session.fullName.toLowerCase().split(" ")[0]));
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    return NextResponse.json({ ok: true, challenge });
  } catch (e) {
    console.error("GET challenge", e);
    return NextResponse.json({ error: "Failed to load." }, { status: 500 });
  }
}

/**
 * PATCH /api/challenges/:id
 * body: { challenge } full replace
 *    or { action: 'join' }
 *    or { action: 'toggle-day' | 'mark-day', participantId, dayIndex, completedDays? }
 */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const { id } = await ctx.params;
    const body = (await req.json()) as {
      challenge?: SavedChallenge;
      action?: "join" | "toggle-day" | "mark-day" | "save";
      participantId?: string;
      dayIndex?: number;
      completedDays?: boolean[];
    };

    const existing = await dbGetChallenge(id);
    if (!existing && !body.challenge) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (body.challenge && body.challenge.id === id) {
      const saved = await dbUpsertChallenge(body.challenge, session.id);
      return NextResponse.json({ ok: true, challenge: saved });
    }

    if (!existing) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (body.action === "join") {
      const already = existing.participants.some(
        (p) =>
          p.userId === session.id ||
          p.name.trim().toLowerCase() ===
            session.fullName.trim().toLowerCase()
      );
      if (already) {
        return NextResponse.json({ ok: true, challenge: existing });
      }
      const me = createParticipant(
        session.fullName,
        existing.days,
        true,
        session.id
      );
      const saved = await dbAddParticipant(id, me);
      return NextResponse.json({ ok: true, challenge: saved });
    }

    if (
      (body.action === "toggle-day" || body.action === "mark-day") &&
      body.participantId &&
      typeof body.dayIndex === "number"
    ) {
      const p = existing.participants.find((x) => x.id === body.participantId);
      if (!p) {
        return NextResponse.json(
          { error: "Participant not found." },
          { status: 404 }
        );
      }
      // Only own days (or matching user)
      const isOwn =
        p.userId === session.id ||
        p.name.trim().toLowerCase() === session.fullName.trim().toLowerCase() ||
        p.name.trim().toLowerCase().split(" ")[0] ===
          session.fullName.trim().toLowerCase().split(" ")[0];
      if (!isOwn) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }

      const days = [...p.completedDays];
      while (days.length < existing.days) days.push(false);
      const idx = body.dayIndex;
      if (idx < 0 || idx >= existing.days) {
        return NextResponse.json({ error: "Invalid day." }, { status: 400 });
      }
      if (body.action === "mark-day") {
        days[idx] = true;
      } else if (Array.isArray(body.completedDays)) {
        // full array override
        return NextResponse.json({
          ok: true,
          challenge: await dbUpdateParticipantDays(
            id,
            body.participantId,
            body.completedDays
          ),
        });
      } else {
        days[idx] = !days[idx];
      }
      const saved = await dbUpdateParticipantDays(id, body.participantId, days);
      return NextResponse.json({ ok: true, challenge: saved });
    }

    if (body.action === "save" && Array.isArray(body.completedDays) && body.participantId) {
      const saved = await dbUpdateParticipantDays(
        id,
        body.participantId,
        body.completedDays
      );
      return NextResponse.json({ ok: true, challenge: saved });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    console.error("PATCH challenge", e);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
