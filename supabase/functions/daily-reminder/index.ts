/**
 * Supabase Edge Function: daily-reminder
 *
 * Schedule (Dashboard → Edge Functions → Cron):
 *   0 * * * *   (every hour — the app only delivers at 9 PM local time)
 *
 * Or specifically near 9 PM IST (15:00–16:00 UTC):
 *   0 15,16 * * *
 *
 * Secrets (supabase secrets set ...):
 *   APP_URL      = https://your-app.vercel.app
 *   CRON_SECRET  = same as Next.js CRON_SECRET
 */
const APP_URL =
  Deno.env.get("APP_URL") || "https://sadhana-challenge-mu.vercel.app";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

Deno.serve(async (req) => {
  // Optional: allow only POST from Supabase cron / authorized callers
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!APP_URL) {
    return Response.json(
      { error: "APP_URL secret not set" },
      { status: 500 }
    );
  }

  try {
    const url = `${APP_URL.replace(/\/$/, "")}/api/push/send-daily`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "x-cron-secret": CRON_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "supabase-edge-cron" }),
    });

    const data = await res.json().catch(() => ({}));
    return Response.json({
      ok: res.ok,
      status: res.status,
      upstream: data,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
});
