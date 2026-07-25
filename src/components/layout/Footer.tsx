"use client";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gold/40 bg-white pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <p className="mx-auto max-w-2xl text-center font-serif text-sm leading-relaxed text-krishna sm:text-base md:text-lg">
          Hare Krishna Hare Krishna Krishna Krishna Hare Hare
          <br />
          Hare Rama Hare Rama Rama Rama Hare Hare
        </p>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          © 2026 Sadhana Challenge · All glories to Srila Prabhupada
        </p>
      </div>

      <div className="h-8 w-full opacity-20" aria-hidden>
        <svg viewBox="0 0 1200 40" className="h-full w-full" preserveAspectRatio="none">
          <path
            fill="#1A2F5A"
            d="M0 40 V28 L40 20 L60 28 L100 12 L140 28 L180 18 L220 28 L260 8 L300 28 L340 20 L380 28 L420 14 L460 28 L500 10 L540 28 L580 16 L620 28 L660 6 L700 28 L740 18 L780 28 L820 12 L860 28 L900 20 L940 28 L980 14 L1020 28 L1060 22 L1100 28 L1140 16 L1180 28 L1200 24 V40 Z"
          />
        </svg>
      </div>
    </footer>
  );
}
