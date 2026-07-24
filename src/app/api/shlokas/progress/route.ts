import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  dbGetShlokaCompletions,
  dbSetShlokaCompletions,
  dbToggleShlokaCompletion,
} from "@/lib/user-data-db";

/** GET /api/shlokas/progress — completed shloka ids for current user */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const ids = await dbGetShlokaCompletions(session.id);
    return NextResponse.json({ ok: true, completedIds: ids });
  } catch (e) {
    console.error("GET shlokas progress", e);
    return NextResponse.json(
      { error: "Failed to load progress." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shlokas/progress
 * { completedIds: string[] } — replace set
 * { toggleId: string } — toggle one
 */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const body = (await req.json()) as {
      completedIds?: string[];
      toggleId?: string;
    };

    if (body.toggleId) {
      const result = await dbToggleShlokaCompletion(session.id, body.toggleId);
      return NextResponse.json({
        ok: true,
        completedIds: result.ids,
        toggled: body.toggleId,
        completed: result.completed,
      });
    }

    if (Array.isArray(body.completedIds)) {
      const ids = await dbSetShlokaCompletions(session.id, body.completedIds);
      return NextResponse.json({ ok: true, completedIds: ids });
    }

    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  } catch (e) {
    console.error("PUT shlokas progress", e);
    return NextResponse.json(
      { error: "Failed to save progress." },
      { status: 500 }
    );
  }
}
