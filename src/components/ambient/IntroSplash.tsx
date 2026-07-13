"use client";

import { useCallback, useEffect, useState } from "react";

export const INTRO_SESSION_KEY = "bhakti-intro-played";
const INTRO_MS = 5000;

type Phase = "play" | "exit" | "done";

type IntroMedia = {
  desktop: string;
  mobile: string;
};

const DEFAULT_MEDIA: IntroMedia = {
  desktop: "/intro-vrindavan-bg.jpg",
  mobile: "/intro-vrindavan-mobile.jpg",
};

function markIntroFinished() {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-intro-done", "1");
  }
}

/**
 * Netflix-style title over Krishna–Vrindavan art.
 *
 * Important for hydration:
 * - First paint always uses the same static markup (SSR === client).
 * - No framer-motion (it injects inline styles that mismatch SSR).
 * - Session skip happens only in useEffect / blocking layout script + CSS.
 */
export function IntroSplash() {
  // Always "play" on first render so server HTML matches client hydrate.
  const [phase, setPhase] = useState<Phase>("play");
  const [media, setMedia] = useState<IntroMedia>(DEFAULT_MEDIA);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/intro-media")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { desktop?: string; mobile?: string; video?: string } | null) => {
          if (cancelled || !data) return;
          setMedia({
            desktop: data.desktop || DEFAULT_MEDIA.desktop,
            mobile: data.mobile || DEFAULT_MEDIA.mobile,
          });
        }
      )
      .catch(() => {
        /* keep local defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_SESSION_KEY) === "1") {
        markIntroFinished();
        setPhase("done");
        return;
      }
    } catch {
      /* private mode — show intro */
    }
    document.documentElement.removeAttribute("data-intro-done");
  }, []);

  const finish = useCallback(() => {
    setPhase((p) => {
      if (p === "exit" || p === "done") return p;
      return "exit";
    });
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    markIntroFinished();
    const t = window.setTimeout(() => setPhase("done"), 550);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const timer = window.setTimeout(finish, INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  if (phase === "done") return null;

  return (
    <div
      id="bhakti-intro-splash"
      className={
        phase === "exit"
          ? "bhakti-intro-splash bhakti-intro-splash--exit"
          : "bhakti-intro-splash"
      }
      aria-label="Bhakti Challenge intro"
      role="dialog"
      aria-modal="true"
    >
      <div className="bhakti-intro-zoom absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.mobile}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center sm:hidden"
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.desktop}
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
          draggable={false}
        />
      </div>

      <div
        className="absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,25,60,0.15) 0%, transparent 28%, transparent 48%, rgba(20,30,70,0.35) 72%, rgba(15,20,50,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden sm:block"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(255,213,79,0.16) 0%, transparent 48%), radial-gradient(ellipse at center, transparent 40%, rgba(20,30,80,0.4) 100%), linear-gradient(180deg, rgba(26,79,163,0.18) 0%, transparent 38%, rgba(255,140,60,0.22) 100%)",
        }}
      />

      <div
        className="bhakti-intro-glow pointer-events-none absolute left-1/2 top-[38%] h-[36vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full sm:top-1/2"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[10, 22, 36, 50, 64, 78, 90].map((left, i) => (
          <span
            key={left}
            className="intro-petal absolute text-base opacity-50 sm:text-xl sm:opacity-60"
            style={{
              left: `${left}%`,
              top: `${4 + (i % 4) * 8}%`,
              animationDuration: `${5.5 + i * 0.55}s`,
              animationDelay: `${i * 0.28}s`,
            }}
          >
            {i % 3 === 0 ? "🪷" : "🌸"}
          </span>
        ))}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-5 pb-[14vh] text-center sm:justify-center sm:pb-0">
        <div className="bhakti-intro-lotus mb-2 text-3xl sm:mb-4 sm:text-5xl">
          🪷
        </div>

        <h1
          className="bhakti-intro-title font-serif font-bold tracking-wide text-white"
          style={{
            fontSize: "clamp(1.85rem, 8.5vw, 5.25rem)",
            textShadow:
              "0 0 40px rgba(255,213,79,0.65), 0 0 80px rgba(255,183,71,0.35), 0 4px 24px rgba(0,0,0,0.55)",
            letterSpacing: "0.04em",
          }}
        >
          Bhakti Challenge
        </h1>

        <div
          className="bhakti-intro-line mt-3 h-[3px] rounded-full sm:mt-5"
          style={{
            background:
              "linear-gradient(90deg, transparent, #FFD54F, #FFB347, #FFD54F, transparent)",
            boxShadow: "0 0 16px rgba(255,213,79,0.8)",
          }}
        />

        <p
          className="bhakti-intro-sub mt-3 max-w-lg font-serif text-xs italic leading-relaxed text-white/95 sm:mt-6 sm:text-base md:text-lg"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.55)" }}
        >
          For the Pleasure of Sri Sri Radha Govindji
          <br />
          and Srila Prabhupada
        </p>
      </div>
    </div>
  );
}
