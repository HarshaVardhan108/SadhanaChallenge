import webpush from "web-push";
import { api, getConvexClient } from "@/lib/convex";
import type { Id } from "../../convex/_generated/dataModel";

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type DbPushSubscription = {
  id: string;
  user_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
  timezone: string;
  hour: number;
  last_sent_date: string | null;
};

let vapidConfigured = false;

function envTrim(name: string): string | null {
  const v = process.env[name];
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function configureWebPush(): boolean {
  const publicKey = envTrim("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const privateKey = envTrim("VAPID_PRIVATE_KEY");
  const subject =
    envTrim("VAPID_SUBJECT") || "mailto:admin@bhaktichallenge.app";

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys missing — push notifications disabled");
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

export function getPublicVapidKey(): string | null {
  return envTrim("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
}

export async function savePushSubscription(opts: {
  userId?: string | null;
  subscription: PushSubscriptionJSON;
  timezone?: string;
  hour?: number;
  enabled?: boolean;
}): Promise<void> {
  const { subscription } = opts;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Invalid push subscription");
  }
  const timezone = opts.timezone || process.env.PUSH_TZ || "Asia/Kolkata";
  const hour = Number(opts.hour ?? process.env.PUSH_HOUR ?? 21);
  const enabled = opts.enabled !== false;

  const convex = getConvexClient();
  await convex.mutation(api.push.saveSubscription, {
    userId: (opts.userId as Id<"users"> | null) || null,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    enabled,
    timezone,
    hour,
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const convex = getConvexClient();
  await convex.mutation(api.push.removeSubscription, { endpoint });
}

export async function setPushEnabled(
  endpoint: string,
  enabled: boolean
): Promise<void> {
  const convex = getConvexClient();
  await convex.mutation(api.push.setEnabled, { endpoint, enabled });
}

export async function listEnabledSubscriptions(): Promise<DbPushSubscription[]> {
  const convex = getConvexClient();
  return await convex.query(api.push.listEnabled, {});
}

/**
 * Local calendar date YYYY-MM-DD in a given IANA timezone.
 */
export function localDateInTz(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Hour (0–23) in the given timezone. */
export function localHourInTz(timeZone: string, date = new Date()): number {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(date);
    const h = Number(hourStr);
    return h === 24 ? 0 : h;
  } catch {
    return date.getUTCHours();
  }
}

/** Absolute logo URL for push notifications (browsers need a full URL). */
export function pushLogoUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://sadhana-challenge-mu.vercel.app"
  )
    .replace(/\/$/, "")
    .replace(/\/login\/?$/i, "");
  const path = "/icons/icon-192.png";
  return `${base}${path}`;
}

/** True if user created or joined at least one challenge. */
export async function userHasAnyChallenges(userId: string): Promise<boolean> {
  const convex = getConvexClient();
  return await convex.query(api.challenges.userHasAnyChallenges, { userId });
}

export async function sendPushToSubscription(
  sub: DbPushSubscription,
  payload: { title: string; body: string; url?: string; icon?: string }
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!configureWebPush()) {
    return { ok: false, error: "VAPID not configured" };
  }

  const icon = payload.icon || pushLogoUrl();

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/challenges",
        icon,
        badge: icon,
      }),
      { TTL: 60 * 60 * 12, urgency: "normal" }
    );
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    if (err.statusCode === 404 || err.statusCode === 410) {
      await removePushSubscription(sub.endpoint);
      return { ok: false, gone: true, error: err.message };
    }
    console.error("web-push error", err.statusCode, err.message);
    return { ok: false, error: err.message || "send failed" };
  }
}

export async function markSubscriptionSent(
  id: string,
  dateKey: string
): Promise<void> {
  const convex = getConvexClient();
  await convex.mutation(api.push.markSent, {
    id: id as Id<"pushSubscriptions">,
    dateKey,
  });
}

/** Fixed daily reminder copy */
export const DAILY_REMINDER = {
  title: "Sadhana Challenge",
  body: "Hare Krishna PR, please complete your challenge",
  url: "/challenges",
} as const;

/**
 * Send the daily 9pm (or configured hour) reminder to due subscriptions.
 * Only users who have created or joined at least one challenge receive a push.
 */
export async function sendDailyReminders(now = new Date()): Promise<{
  checked: number;
  sent: number;
  skipped: number;
  noChallenge: number;
  failed: number;
  removed: number;
}> {
  const subs = await listEnabledSubscriptions();
  let sent = 0;
  let skipped = 0;
  let noChallenge = 0;
  let failed = 0;
  let removed = 0;

  const logo = pushLogoUrl();

  for (const sub of subs) {
    const tz = sub.timezone || "Asia/Kolkata";
    const targetHour = Number(sub.hour ?? 21);
    const hourNow = localHourInTz(tz, now);
    const dateKey = localDateInTz(tz, now);

    if (hourNow !== targetHour) {
      skipped += 1;
      continue;
    }
    if (sub.last_sent_date === dateKey) {
      skipped += 1;
      continue;
    }

    if (!sub.user_id) {
      noChallenge += 1;
      continue;
    }
    const hasChallenge = await userHasAnyChallenges(sub.user_id);
    if (!hasChallenge) {
      noChallenge += 1;
      continue;
    }

    const result = await sendPushToSubscription(sub, {
      title: DAILY_REMINDER.title,
      body: DAILY_REMINDER.body,
      url: DAILY_REMINDER.url,
      icon: logo,
    });

    if (result.ok) {
      await markSubscriptionSent(sub.id, dateKey);
      sent += 1;
    } else if (result.gone) {
      removed += 1;
    } else {
      failed += 1;
    }
  }

  return {
    checked: subs.length,
    sent,
    skipped,
    noChallenge,
    failed,
    removed,
  };
}
