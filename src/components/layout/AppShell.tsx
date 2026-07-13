"use client";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { FluteAmbient } from "@/components/ambient/FluteAmbient";
import { DailyNotificationPopup } from "@/components/ambient/DailyNotificationPopup";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { motion } from "framer-motion";

/**
 * Mobile-first shell: bottom tabs + compact top bar.
 * Clean cream surface; Vrindavan ambient only on login/register.
 * Guests are limited to the dashboard via GuestGuard.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-wash relative flex min-h-dvh flex-col">
      <Navbar />
      <motion.main
        initial={false}
        className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-24 lg:px-6 lg:py-8 lg:pb-8"
      >
        <GuestGuard>{children}</GuestGuard>
      </motion.main>
      <Footer />
      <MobileTabBar />
      <div className="hidden sm:block">
        <FluteAmbient />
      </div>
      <DailyNotificationPopup />
    </div>
  );
}
