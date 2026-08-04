"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "bhakti-pwa-install-dismissed";

/**
 * Registers the service worker and shows a subtle install banner
 * when the browser fires beforeinstallprompt (Chrome/Edge/Android).
 */
export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone
      );
    setStandalone(isStandalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(ios);

    // Register service worker only in production.
    // In dev, a SW cache-first strategy breaks Turbopack HMR module graphs
    // (stale lucide/chunk factories → runtime errors).
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) =>
            Promise.all(
              regs.map((reg) =>
                reg.unregister().catch(() => false)
              )
            )
          )
          .then(() =>
            "caches" in window
              ? caches.keys().then((keys) =>
                  Promise.all(keys.map((k) => caches.delete(k)))
                )
              : undefined
          )
          .catch(() => undefined);
      } else {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          .then((reg) => {
            reg.update().catch(() => undefined);
          })
          .catch(() => {
            /* private mode / unsupported */
          });
      }
    }

    if (isStandalone) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    // iOS: show manual install tip after a short delay
    if (ios && !isStandalone) {
      const t = window.setTimeout(() => setVisible(true), 2500);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user cancelled */
    }
    setDeferred(null);
    setVisible(false);
  };

  if (standalone || !visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[55] px-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm lg:bottom-6"
      )}
      role="dialog"
      aria-label="Install Sadhana Challenge"
    >
      <div className="rounded-2xl border border-gold/50 bg-white/95 p-3 shadow-xl backdrop-blur-md sm:p-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-gold/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-sm font-bold text-krishna">
              Install Sadhana Challenge
            </p>
            {isIos && !deferred ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                Tap Share{" "}
                <span aria-hidden className="font-semibold text-peacock">
                  ⎋
                </span>{" "}
                then <strong>Add to Home Screen</strong>
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                Add to your home screen for a full-screen app experience.
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {deferred && (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-krishna px-3 py-1.5 text-xs font-semibold text-white shadow-sm active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full border border-gold/40 bg-cream px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] active:scale-95"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-[var(--text-muted)] hover:bg-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
