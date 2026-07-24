import { NextResponse } from "next/server";
import { sendDailyReminders } from "@/lib/web-push";

/**
 * POST /api/push/send-daily
 * Called by Supabase Edge Function cron (or Vercel Cron) every hour.
 * Sends Web Push reminders only to users whose local time is 9 PM
 * and who have not already received one today.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 *   or  x-cron-secret: <CRON_SECRET>
 */
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Dev fallback: allow when secret not set and not production
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const header = req.headers.get("x-cron-secret") || "";
  return bearer === secret || header === secret;
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDailyReminders(new Date());
    return NextResponse.json({
      ok: true,
      ...result,
      at: new Date().toISOString(),
      note: "Sends only when local hour matches PUSH_HOUR (default 21 / 9 PM Asia/Kolkata).",
    });
  } catch (e) {
    console.error("send-daily", e);
    return NextResponse.json(
      { error: "Failed to send daily reminders." },
      { status: 500 }
    );
  }
}

/** GET also supported for Vercel Cron (which uses GET by default on some plans). */
export async function GET(req: Request) {
  return POST(req);
}
