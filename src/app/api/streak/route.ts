import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbGetStreak, dbSaveStreak } from "@/lib/user-data-db";
import {
  getDailyStreakSnapshot,
  type DailyStreakState,
} from "@/lib/daily-streak";

/** GET /api/streak */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const state = await dbGetStreak(session.id);
    const snapshot = getDailyStreakSnapshot({
      completedDates: state.completedDates,
      bestStreak: state.bestStreak,
      updatedAt: state.updatedAt,
    });
    return NextResponse.json({ ok: true, state, snapshot });
  } catch (e) {
    console.error("GET /api/streak", e);
    return NextResponse.json({ error: "Failed to load streak." }, { status: 500 });
  }
}

/** PUT /api/streak — replace completed dates + best */
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    const body = (await req.json()) as Partial<DailyStreakState> & {
      markToday?: boolean;
      unmarkToday?: boolean;
    };

    let state = await dbGetStreak(session.id);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayKey = `${y}-${m}-${d}`;

    if (body.markToday) {
      if (!state.completedDates.includes(todayKey)) {
        state = {
          ...state,
          completedDates: [...state.completedDates, todayKey].sort(),
        };
      }
    } else if (body.unmarkToday) {
      state = {
        ...state,
        completedDates: state.completedDates.filter((x) => x !== todayKey),
      };
    } else if (Array.isArray(body.completedDates)) {
      state = {
        ...state,
        completedDates: body.completedDates.map(String),
        bestStreak:
          typeof body.bestStreak === "number"
            ? body.bestStreak
            : state.bestStreak,
      };
    }

    const snap = getDailyStreakSnapshot({
      completedDates: state.completedDates,
      bestStreak: state.bestStreak,
      updatedAt: state.updatedAt,
    });
    const best = Math.max(state.bestStreak, snap.bestStreak, snap.currentStreak);
    const saved = await dbSaveStreak(session.id, {
      completedDates: state.completedDates,
      bestStreak: best,
    });
    const snapshot = getDailyStreakSnapshot({
      completedDates: saved.completedDates,
      bestStreak: saved.bestStreak,
      updatedAt: saved.updatedAt,
    });
    return NextResponse.json({ ok: true, state: saved, snapshot });
  } catch (e) {
    console.error("PUT /api/streak", e);
    return NextResponse.json({ error: "Failed to save streak." }, { status: 500 });
  }
}
