"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enable / disable daily 9 PM sadhana Web Push reminders.
 */
export function PushReminder({ className }: { className?: string }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hour, setHour] = useState(21);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
    }

    fetch("/api/push/subscribe")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: { publicKey?: string; hour?: number; timezone?: string } | null
        ) => {
          if (data?.hour != null) setHour(data.hour);
          if (data?.timezone) setTimezone(data.timezone);
        }
      )
      .catch(() => null);

    // Detect existing subscription
    if (ok) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(Boolean(sub)))
        .catch(() => setSubscribed(false));
    }
  }, []);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const cfgRes = await fetch("/api/push/subscribe");
      const cfg = (await cfgRes.json()) as {
        ok?: boolean;
        publicKey?: string;
        error?: string;
        hour?: number;
        timezone?: string;
      };
      if (!cfgRes.ok || !cfg.publicKey) {
        setError(cfg.error || "Push is not configured on the server.");
        return;
      }
      if (cfg.hour != null) setHour(cfg.hour);
      if (cfg.timezone) setTimezone(cfg.timezone);

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Notification permission was denied.");
        return;
      }

      // Ensure SW is registered
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        }));
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            cfg.publicKey
          ) as BufferSource,
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          timezone: cfg.timezone || "Asia/Kolkata",
          hour: cfg.hour ?? 21,
          enabled: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save subscription.");
        return;
      }
      setSubscribed(true);
      setMessage(
        `Daily reminder on — every day at ${cfg.hour ?? 21}:00 (${cfg.timezone || "Asia/Kolkata"}).`
      );
    } catch (e) {
      console.error(e);
      setError("Could not enable push. Use HTTPS (or localhost) and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessage("Daily reminder turned off.");
    } catch {
      setError("Could not disable reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!supported) {
    return (
      <div className={cn("text-sm text-[var(--text-muted)]", className)}>
        Push notifications are not supported in this browser. Try Chrome or Edge
        on Android / desktop.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-krishna/10 text-krishna">
          {subscribed ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-krishna">Daily 9 PM reminder</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
            Every evening at{" "}
            <strong>
              {hour}:00 ({timezone})
            </strong>
            :{" "}
            <em>
              &ldquo;Hare Krishna PR, please complete your challenge&rdquo;
            </em>
            — only if you have joined or created a challenge. Includes the app
            logo.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {subscribed ? (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void disable()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            Turn off
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={loading || permission === "denied"}
            onClick={() => void enable()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Enable 9 PM reminder
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <p className="text-xs text-rose-600">
          Notifications are blocked for this site. Enable them in browser
          settings, then try again.
        </p>
      )}
      {message && (
        <p className="text-xs font-medium text-tulasi" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
