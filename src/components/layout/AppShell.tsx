"use client";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { FluteAmbient } from "@/components/ambient/FluteAmbient";
import { DailyNotificationPopup } from "@/components/ambient/DailyNotificationPopup";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { ShlokaAudioProvider } from "@/components/shlokas/ShlokaAudioProvider";
import { ShlokaMiniPlayer } from "@/components/shlokas/ShlokaMiniPlayer";

/**
 * Mobile-first shell: bottom tabs + compact top bar.
 * Clean cream surface; Vrindavan ambient only on login/register.
 * Guests are limited to the dashboard via GuestGuard.
 * Shloka audio lives here so playback continues across routes / background.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShlokaAudioProvider>
      <div className="app-wash relative flex min-h-dvh flex-col">
        <Navbar />
        <ShlokaMiniPlayer />
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-24 lg:px-6 lg:py-8 lg:pb-8">
          <GuestGuard>{children}</GuestGuard>
        </main>
        <Footer />
        <MobileTabBar />
        <div className="hidden sm:block">
          <FluteAmbient />
        </div>
        <DailyNotificationPopup />
      </div>
    </ShlokaAudioProvider>
  );
}
