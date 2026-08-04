"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Sparkles,
  BookOpen,
  Trophy,
  Award,
  UserPlus,
  User,
  Settings,
  Bell,
  BarChart3,
  LogIn,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isGuestUser } from "@/lib/guest";
import { logoutClient } from "@/lib/logout";

/** Fixed desktop nav — same list on server and client (no guest filtering). */
const mainNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/challenges", label: "Challenges", icon: Sparkles },
  { href: "/shlokas", label: "Shlokas", icon: BookOpen },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

const moreNav = [
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/invite", label: "Invite Friends", icon: UserPlus },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Compact top bar on mobile; full nav on desktop (tabs handle mobile primary). */
export function Navbar() {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsGuest(isGuestUser());
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setMoreOpen(false);
    try {
      await logoutClient();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gold/40 bg-white pt-[env(safe-area-inset-top)] shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-gold/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-bold leading-tight sm:text-base">
              <span className="text-krishna">Sadhana</span>{" "}
              <span className="text-gold">Challenge</span>
            </p>
            <p
              className="hidden text-[10px] tracking-wide text-peacock sm:block"
              suppressHydrationWarning
            >
              {mounted && isGuest ? "Guest mode" : "Goloka · Vrindavan"}
            </p>
          </div>
        </Link>

        {/* Desktop nav — static item list (never guest-filtered) so SSR matches client */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main"
        >
          {mainNav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "text-krishna"
                    : "text-[var(--text-muted)] hover:bg-cream hover:text-krishna"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
                {active ? (
                  <span
                    className="absolute inset-0 -z-10 rounded-xl border border-gold/40 bg-gold/25"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}

          {/* More menu only for logged-in users; hide until mounted to avoid guest flash */}
          {mounted && !isGuest ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-cream hover:text-krishna"
              >
                More ▾
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gold/40 bg-white p-2 shadow-xl">
                  {moreNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-gold/20",
                          pathname.startsWith(item.href)
                            ? "font-medium text-krishna"
                            : "text-[var(--text-muted)]"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="my-1 border-t border-gold/30" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {loggingOut ? "Signing out…" : "Logout"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2" suppressHydrationWarning>
          {mounted && isGuest ? (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-krishna px-3 text-xs font-semibold text-white shadow sm:px-4 sm:text-sm"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Login
            </Link>
          ) : (
            <>
              <Link
                href="/notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-cream text-krishna transition active:bg-gold/30"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-saffron" />
              </Link>
              <Link
                href="/profile"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold to-saffron text-sm font-bold text-krishna shadow"
                aria-label="Profile"
              >
                H
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
