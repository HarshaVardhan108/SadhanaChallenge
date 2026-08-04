"use client";

import { useCallback, useEffect, useState } from "react";
import slideRed from "@/assets/IMG-20260724-WA0070.jpg";
import slideSilver from "@/assets/IMG-20260724-WA0058.jpg";
import desktopBg from "@/components/assets/intro-vrindavan-bg.jpg";
import { INTRO_SESSION_KEY } from "@/lib/intro";

export { INTRO_SESSION_KEY };

/** Crossfade interval between the two mobile deity images (ms). */
const SLIDE_MS = 4500;

type Phase = "play" | "exit" | "done";

function imgSrc(img: string | { src: string }): string {
  return typeof img === "string" ? img : img.src;
}

/** Mobile only: crossfade between two photos */
const MOBILE_SLIDES = [
  {
    src: imgSrc(slideRed),
    alt: "Sri Sri Radha Krishna — divine connection",
  },
  {
    src: imgSrc(slideSilver),
    alt: "Sri Sri Radha Krishna in silver — divine connection",
  },
] as const;

/** Desktop: single Vrindavan background (no slideshow) */
const DESKTOP_HERO = {
  src: imgSrc(desktopBg),
  alt: "Vrindavan — divine connection",
};

/** Session cookie so the server can skip intro without a blocking <script>. */
function setIntroCookie() {
  try {
    document.cookie = `${INTRO_SESSION_KEY}=1; path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function markIntroFinished() {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
  setIntroCookie();
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-intro-done", "1");
  }
}

/**
 * Onboarding intro matching ISKCON Pandharpur-style design:
 * hero deity image, scalloped white panel, title + CTA.
 * Does NOT auto-dismiss — user must tap BEGIN JOURNEY to reach login.
 */
export function IntroSplash() {
  // Always "play" on first render so server HTML matches client hydrate.
  const [phase, setPhase] = useState<Phase>("play");
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  // Smooth loop between mobile images only (desktop stays on one image)
  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % MOBILE_SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const finish = useCallback(() => {
    setPhase((p) => {
      if (p === "exit" || p === "done") return p;
      return "exit";
    });
  }, []);

  useEffect(() => {
    if (phase !== "exit") return;
    markIntroFinished();
    const t = window.setTimeout(() => setPhase("done"), 600);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      id="bhakti-intro-splash"
      className={
        phase === "exit"
          ? "bhakti-intro-splash bhakti-intro-splash--exit"
          : "bhakti-intro-splash"
      }
      aria-label="Welcome to Sadhana Challenge"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Hero image region (taller — panel stays compact) ───── */}
      <div className="bhakti-intro-hero absolute inset-x-0 top-0 h-[70%] overflow-hidden sm:h-[74%]">
        {/* Mobile: two-image crossfade */}
        {MOBILE_SLIDES.map((item, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.src}
            src={item.src}
            alt={item.alt}
            draggable={false}
            className={
              "bhakti-intro-slide absolute inset-0 h-full w-full object-cover object-[center_18%] sm:hidden" +
              (slide === i || (!mounted && i === 0)
                ? " bhakti-intro-slide--active"
                : "")
            }
          />
        ))}

        {/* Desktop: single intro-vrindavan-bg.jpg only */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DESKTOP_HERO.src}
          alt={DESKTOP_HERO.alt}
          draggable={false}
          className="bhakti-intro-slide bhakti-intro-slide--active bhakti-intro-slide--desktop absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
        />

        {/* Soft top vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 28%, transparent 70%, rgba(255,248,240,0.15) 100%)",
          }}
          aria-hidden
        />

        {/* Floating petals over the image */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          {[8, 22, 38, 55, 70, 84, 92].map((left, i) => (
            <span
              key={left}
              className="intro-petal absolute text-sm opacity-70 sm:text-base"
              style={{
                left: `${left}%`,
                top: `${6 + (i % 3) * 10}%`,
                animationDuration: `${6 + i * 0.5}s`,
                animationDelay: `${i * 0.35}s`,
                color: i % 2 === 0 ? "#ff8fab" : "#ffd6a5",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
              }}
            >
              {i % 3 === 0 ? "❀" : "❁"}
            </span>
          ))}
        </div>
      </div>

      {/* ── Scalloped white bottom panel (compact height) ───────── */}
      <div className="bhakti-intro-panel absolute inset-x-0 bottom-0 z-10 flex h-[32%] max-h-[280px] min-h-[200px] flex-col items-center justify-center bg-[#fff9f6] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:h-[28%] sm:max-h-[240px] sm:min-h-[180px] sm:px-10 sm:pt-5 sm:pb-6">
        {/* Wave / scallop edge */}
        <div
          className="bhakti-intro-scallop pointer-events-none absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]"
          aria-hidden
        >
          <svg
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            className="block h-6 w-full sm:h-7"
          >
            <path
              d="M0,48
                 C40,48 40,4 80,4
                 C120,4 120,48 160,48
                 C200,48 200,4 240,4
                 C280,4 280,48 320,48
                 C360,48 360,4 400,4
                 C440,4 440,48 480,48
                 C520,48 520,4 560,4
                 C600,4 600,48 640,48
                 C680,48 680,4 720,4
                 C760,4 760,48 800,48
                 C840,48 840,4 880,4
                 C920,4 920,48 960,48
                 C1000,48 1000,4 1040,4
                 C1080,4 1080,48 1120,48
                 C1160,48 1160,4 1200,4
                 L1200,48 Z"
              fill="#fff9f6"
            />
          </svg>
        </div>

        <div className="bhakti-intro-copy mx-auto flex w-full max-w-md flex-col items-center justify-center text-center">
          <h1 className="bhakti-intro-title font-serif text-[1.5rem] font-bold leading-tight tracking-tight text-[#3d2914] sm:text-[1.75rem]">
            Divine Connection
          </h1>
          <p className="bhakti-intro-sub mt-1 max-w-xs text-xs leading-relaxed text-[#6b5344] sm:mt-1.5 sm:text-sm">
            Serenity and joy of being connected.
          </p>

          {/* Slide dots — mobile only (desktop uses one image) */}
          <div
            className="mt-3 flex items-center gap-2 sm:hidden"
            role="tablist"
            aria-label="Intro images"
          >
            {MOBILE_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={slide === i}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setSlide(i)}
                className={
                  "h-1.5 rounded-full transition-all duration-500 " +
                  (slide === i
                    ? "w-5 bg-[#ff4d6d]"
                    : "w-1.5 bg-[#ffc2cc] hover:bg-[#ff8fa3]")
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={finish}
            className="bhakti-intro-cta mt-4 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[#ff4d6d] px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(255,77,109,0.35)] transition active:scale-[0.98] hover:bg-[#f43f5e] sm:mt-5 sm:py-3 sm:text-sm"
          >
            Begin Journey
            <span aria-hidden className="text-base font-normal">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
