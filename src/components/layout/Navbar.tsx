"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Sparkles,
  BookOpen,
  Trophy,
  Users,
  Award,
  UserPlus,
  MapPin,
  User,
  Settings,
  Bell,
  BarChart3,
  Calendar,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isGuestUser } from "@/lib/guest";

const mainNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/challenges", label: "Challenges", icon: Sparkles },
  { href: "/shlokas", label: "Shlokas", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community", label: "Community", icon: Users },
];

const moreNav = [
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/invite", label: "Invite Friends", icon: UserPlus },
  { href: "/temple-map", label: "Temple Map", icon: MapPin },
  { href: "/festivals", label: "Festivals", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const guestMainNav = [
  { href: "/dashboard", label: "Home", icon: Home },
];

/** Compact top bar on mobile; full nav on desktop (tabs handle mobile primary). */
export function Navbar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setIsGuest(isGuestUser());
  }, [pathname]);

  const navItems = isGuest ? guestMainNav : mainNav;

  return (
    <header className="sticky top-0 z-50 border-b border-gold/40 bg-white pt-[env(safe-area-inset-top)] shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-krishna to-peacock text-lg shadow-md">
            🪷
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-bold leading-tight sm:text-base">
              <span className="text-krishna">Bhakti</span>{" "}
              <span className="text-gold">Challenge</span>
            </p>
            <p className="hidden text-[10px] tracking-wide text-peacock sm:block">
              {isGuest ? "Guest mode" : "Goloka · Vrindavan"}
            </p>
          </div>
        </Link>

        {/* Desktop nav only */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
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
                <Icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-xl border border-gold/40 bg-gold/25"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {!isGuest && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-cream hover:text-krishna"
              >
                More ▾
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gold/40 bg-white p-2 shadow-xl"
                  >
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
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isGuest ? (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-krishna px-3 text-xs font-semibold text-white shadow sm:px-4 sm:text-sm"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          ) : (
            <>
              <Link
                href="/notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-cream text-krishna transition active:bg-gold/30"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
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
