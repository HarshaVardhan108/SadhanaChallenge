"use client";

import { clearGuestFlag } from "@/lib/guest";

/** Client-side keys that belong to a signed-in (or guest) session. */
const SESSION_KEYS = [
  "bhakti-user",
  "bhakti-guest",
  "bhakti-is-new-user",
  "bhakti-show-welcome-notif",
  "bhakti-invite-ref",
] as const;

/**
 * Clear the auth cookie via API and wipe local session flags.
 * Does not remove challenge/progress caches so a guest can still browse
 * device-local data if they re-enter as guest.
 */
export async function logoutClient(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* still clear local state */
  }

  clearGuestFlag();

  if (typeof window === "undefined") return;
  try {
    for (const key of SESSION_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
