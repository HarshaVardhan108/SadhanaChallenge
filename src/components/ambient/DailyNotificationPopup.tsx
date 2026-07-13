"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import notificationImage from "@/components/assets/Notification_image.png";

const STORAGE_PREFIX = "bhakti-daily-notif-";
/** Set on successful registration — show popup once on first dashboard visit */
export const WELCOME_NOTIF_KEY = "bhakti-show-welcome-notif";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${STORAGE_PREFIX}${y}-${m}-${day}`;
}

function msUntilNext8pm() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);
  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function isAtOrAfter8pm() {
  return new Date().getHours() >= 20;
}

function wasDismissedToday() {
  try {
    return localStorage.getItem(todayKey()) === "1";
  } catch {
    return false;
  }
}

function hasWelcomeFlag() {
  try {
    return localStorage.getItem(WELCOME_NOTIF_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Shows Notification_image:
 * 1) Immediately after first account registration (welcome flag)
 * 2) Every day at 8:00 PM local (once per day)
 * Close button sits above the image.
 */
export function DailyNotificationPopup() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"welcome" | "daily">("daily");

  const showWelcomeIfNeeded = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!hasWelcomeFlag()) return false;
    setMode("welcome");
    setOpen(true);
    return true;
  }, []);

  const tryShowDaily = useCallback(() => {
    if (typeof window === "undefined") return;
    if (wasDismissedToday()) return;
    if (!isAtOrAfter8pm()) return;
    setMode("daily");
    setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      if (mode === "welcome" || hasWelcomeFlag()) {
        localStorage.removeItem(WELCOME_NOTIF_KEY);
      }
      // Mark daily as seen for today so we don't double-show after register at night
      localStorage.setItem(todayKey(), "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // 1) First priority: just registered
    if (showWelcomeIfNeeded()) {
      return;
    }

    // 2) Daily 8pm
    tryShowDaily();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      const delay = msUntilNext8pm();
      timer = setTimeout(() => {
        if (hasWelcomeFlag()) {
          showWelcomeIfNeeded();
        } else if (!wasDismissedToday() && isAtOrAfter8pm()) {
          setMode("daily");
          setOpen(true);
        }
        schedule();
      }, Math.min(delay, 2147483647));
    };
    schedule();

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    midnightTimer = setTimeout(() => {
      if (!showWelcomeIfNeeded()) tryShowDaily();
    }, nextMidnight.getTime() - now.getTime());

    // Re-check when tab becomes visible (e.g. navigated after register)
    const onVis = () => {
      if (document.visibilityState === "visible") {
        showWelcomeIfNeeded();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // Storage event from same tab navigation — also poll once shortly after mount
    const t = setTimeout(() => showWelcomeIfNeeded(), 300);

    return () => {
      if (timer) clearTimeout(timer);
      if (midnightTimer) clearTimeout(midnightTimer);
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [showWelcomeIfNeeded, tryShowDaily]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={
            mode === "welcome"
              ? "Welcome notification"
              : "Daily reminder"
          }
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-0 sm:pb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              {mode === "welcome" ? (
                <p className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-krishna shadow">
                  Welcome · Account created 🙏
                </p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={close}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-krishna shadow-lg ring-2 ring-gold/50 active:bg-gold/30"
                aria-label="Close notification"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-gold/60 bg-white shadow-2xl sm:rounded-3xl">
              <Image
                src={notificationImage}
                alt="Spiritual welcome notification"
                className="h-auto max-h-[70dvh] w-full object-contain"
                priority
                sizes="(max-width: 448px) 100vw, 448px"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
