import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getPublicVapidKey,
  removePushSubscription,
  savePushSubscription,
  setPushEnabled,
  type PushSubscriptionJSON,
} from "@/lib/web-push";

/** GET — public VAPID key for the client */
export async function GET() {
  const key = getPublicVapidKey()?.trim() || null;
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Push not configured (missing VAPID keys). Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the deployment environment, then redeploy.",
        code: "VAPID_MISSING",
      },
      { status: 503 }
    );
  }
  return NextResponse.json({
    ok: true,
    publicKey: key,
    timezone: process.env.PUSH_TZ || "Asia/Kolkata",
    hour: Number(process.env.PUSH_HOUR || 21),
  });
}

/**
 * POST — save a browser push subscription for daily reminders.
 * body: { subscription, timezone?, hour?, enabled? }
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = (await req.json()) as {
      subscription?: PushSubscriptionJSON;
      timezone?: string;
      hour?: number;
      enabled?: boolean;
    };

    if (!body.subscription?.endpoint) {
      return NextResponse.json(
        { error: "subscription is required." },
        { status: 400 }
      );
    }

    await savePushSubscription({
      userId: session?.id ?? null,
      subscription: body.subscription,
      timezone: body.timezone || process.env.PUSH_TZ || "Asia/Kolkata",
      hour: body.hour ?? Number(process.env.PUSH_HOUR || 21),
      enabled: body.enabled !== false,
    });

    return NextResponse.json({
      ok: true,
      message: "Daily 9 PM reminder enabled.",
    });
  } catch (e) {
    console.error("push subscribe", e);
    return NextResponse.json(
      { error: "Failed to save subscription." },
      { status: 500 }
    );
  }
}

/**
 * DELETE — unsubscribe
 * body: { endpoint }
 * PATCH — enable/disable without deleting
 * body: { endpoint, enabled }
 */
export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { endpoint?: string };
    if (!body.endpoint) {
      return NextResponse.json({ error: "endpoint required." }, { status: 400 });
    }
    await removePushSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push unsubscribe", e);
    return NextResponse.json({ error: "Failed to remove." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      endpoint?: string;
      enabled?: boolean;
    };
    if (!body.endpoint || typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "endpoint and enabled required." },
        { status: 400 }
      );
    }
    await setPushEnabled(body.endpoint, body.enabled);
    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (e) {
    console.error("push patch", e);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
