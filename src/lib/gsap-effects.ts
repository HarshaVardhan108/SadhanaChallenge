"use client";

import gsap from "gsap";

/** Soft divine glow pulse on an element (e.g. after completing a task). */
export function celebrateOffering(el: HTMLElement | null) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.fromTo(
    el,
    { boxShadow: "0 0 0 rgba(255,213,79,0)" },
    {
      boxShadow: "0 0 28px rgba(255,213,79,0.65)",
      duration: 0.45,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    }
  );

  gsap.fromTo(
    el,
    { scale: 1 },
    { scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" }
  );
}

/** Gentle float for decorative nodes. */
export function gentleFloat(el: HTMLElement | null, y = -10) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.to(el, {
    y,
    duration: 2.8,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
}
