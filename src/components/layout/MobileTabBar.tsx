"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Sparkles,
  BookOpen,
  Menu,
  Trophy,
  Award,
  UserPlus,
  BarChart3,
  User,
  Settings,
  X,
  LogIn,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isGuestUser } from "@/lib/guest";
import { logoutClient } from "@/lib/logout";

/** Fixed primary tabs — same list on server and client. */
const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/challenges", label: "Challenges", icon: Sparkles },
  { href: "/shlokas", label: "Shlokas", icon: BookOpen },
  { href: "/study", label: "Study", icon: GraduationCap },
] as const;

const moreLinks = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/invite", label: "Invite", icon: UserPlus },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileTabBar() {
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

  const isTabActive = (href: string) => pathname.startsWith(href);
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.href));

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
    <>
      {/* More sheet — after mount only (never in SSR HTML) */}
      {mounted && moreOpen && !isGuest ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-gold/40 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl lg:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gold/50" />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-serif text-lg font-bold text-krishna">More</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-krishna"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs font-medium",
                      active
                        ? "border-krishna bg-krishna/10 text-krishna"
                        : "border-gold/30 bg-cream text-[var(--text-muted)]"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-700 transition active:bg-rose-100 disabled:opacity-60"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              {loggingOut ? "Signing out…" : "Logout"}
            </button>
          </div>
        </>
      ) : null}

      {/* Bottom tabs — fixed list on server + client */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/40 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(26,79,163,0.08)] lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold sm:text-xs",
                    active ? "text-krishna" : "text-[var(--text-muted)]"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      active && "bg-gold/35"
                    )}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.5 : 2}
                      aria-hidden
                    />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}

          {/* Slot 5: More (logged-in) or Login (guest) — only after mount; SSR uses More shell */}
          <li className="flex-1" suppressHydrationWarning>
            {mounted && isGuest ? (
              <Link
                href="/login"
                className={cn(
                  "flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold sm:text-xs",
                  pathname.startsWith("/login")
                    ? "text-krishna"
                    : "text-[var(--text-muted)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    pathname.startsWith("/login") && "bg-gold/35"
                  )}
                >
                  <LogIn className="h-5 w-5" aria-hidden />
                </span>
                Login
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (mounted && isGuest) return;
                  setMoreOpen(true);
                }}
                className={cn(
                  "flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold sm:text-xs",
                  moreActive || moreOpen
                    ? "text-krishna"
                    : "text-[var(--text-muted)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    (moreActive || moreOpen) && "bg-gold/35"
                  )}
                >
                  <Menu
                    className="h-5 w-5"
                    strokeWidth={moreActive || moreOpen ? 2.5 : 2}
                    aria-hidden
                  />
                </span>
                More
              </button>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}
