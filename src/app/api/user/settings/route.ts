import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGetSettings, dbSaveSettings } from "@/lib/user-data-db";

/** GET /api/user/settings */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const settings = await dbGetSettings(session.id);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("GET settings", e);
    return NextResponse.json({ error: "Failed to load." }, { status: 500 });
  }
}

/** PUT /api/user/settings */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const body = (await req.json()) as {
      spiritualName?: string;
      dailyRounds?: number;
      readingMinutes?: number;
      fluteAmbient?: boolean;
    };
    const settings = await dbSaveSettings(session.id, body);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error("PUT settings", e);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
