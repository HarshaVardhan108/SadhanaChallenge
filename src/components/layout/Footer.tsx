"use client";

import Link from "next/link";

const social = [
  { label: "WhatsApp", href: "https://wa.me/", icon: "💬" },
  { label: "YouTube", href: "https://youtube.com", icon: "▶️" },
  { label: "Instagram", href: "https://instagram.com", icon: "📷" },
  { label: "Telegram", href: "https://t.me/", icon: "✈️" },
  { label: "Facebook", href: "https://facebook.com", icon: "📘" },
];

const links = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/donate", label: "Donate" },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gold/40 bg-white pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        {/* Lotus + peacock feathers + temple */}
        <div className="mb-4 flex items-center justify-center gap-3 text-xl opacity-70 sm:mb-6 sm:gap-4 sm:text-2xl" aria-hidden>
          <span className="animate-sway">🪶</span>
          <span className="animate-float">🪷</span>
          <span className="text-2xl animate-float-slow sm:text-3xl">🛕</span>
          <span className="animate-float" style={{ animationDelay: "1s" }}>
            🪷
          </span>
          <span className="animate-sway" style={{ animationDelay: "0.5s" }}>
            🪶
          </span>
        </div>

        <p className="mx-auto max-w-2xl text-center font-serif text-sm leading-relaxed text-krishna sm:text-base md:text-lg">
          Hare Krishna Hare Krishna Krishna Krishna Hare Hare
          <br />
          Hare Rama Hare Rama Rama Rama Hare Hare
        </p>

        <nav
          className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)] sm:mt-8 sm:gap-x-6"
          aria-label="Footer"
        >
          <Link href="/community" className="transition hover:text-krishna">
            Community
          </Link>
          <Link href="/festivals" className="transition hover:text-krishna">
            Festivals
          </Link>
          <Link href="/temple-map" className="transition hover:text-krishna">
            Temples
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.label === "Donate"
                  ? "font-medium text-peacock transition hover:text-krishna"
                  : "transition hover:text-krishna"
              }
            >
              {l.label}
              {l.label === "Donate" ? " 💛" : ""}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex justify-center gap-4 text-xl">
          {social.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="opacity-60 transition hover:scale-110 hover:opacity-100"
            >
              {s.icon}
            </a>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          © 2026 Bhakti Challenge · All glories to Srila Prabhupada 🙏
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
