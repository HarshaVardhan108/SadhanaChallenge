import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  dbGetStudyHoursForDate,
  dbGetStudyHoursLogs,
  dbSaveStudyHoursLog,
} from "@/lib/user-data-db";

function isValidDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** GET /api/study-hours?date=YYYY-MM-DD | ?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const fromDate = searchParams.get("from") || undefined;
    const toDate = searchParams.get("to") || undefined;

    if (date) {
      if (!isValidDateKey(date)) {
        return NextResponse.json(
          { error: "Invalid date. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }
      const log = await dbGetStudyHoursForDate(session.id, date);
      return NextResponse.json({ ok: true, log });
    }

    if (fromDate && !isValidDateKey(fromDate)) {
      return NextResponse.json(
        { error: "Invalid from date. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }
    if (toDate && !isValidDateKey(toDate)) {
      return NextResponse.json(
        { error: "Invalid to date. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const logs = await dbGetStudyHoursLogs(session.id, { fromDate, toDate });
    return NextResponse.json({ ok: true, logs });
  } catch (e) {
    console.error("GET /api/study-hours", e);
    return NextResponse.json(
      { error: "Failed to load study hours." },
      { status: 500 }
    );
  }
}

/** PUT /api/study-hours — set hours for a date (default today) */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const body = (await req.json()) as {
      date?: string;
      hours?: number;
    };

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const date =
      typeof body.date === "string" && body.date
        ? body.date
        : `${y}-${m}-${d}`;

    if (!isValidDateKey(date)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      return NextResponse.json(
        { error: "Hours must be a number between 0 and 24." },
        { status: 400 }
      );
    }

    const log = await dbSaveStudyHoursLog(session.id, { date, hours });
    return NextResponse.json({ ok: true, log });
  } catch (e) {
    console.error("PUT /api/study-hours", e);
    return NextResponse.json(
      { error: "Failed to save study hours." },
      { status: 500 }
    );
  }
}
