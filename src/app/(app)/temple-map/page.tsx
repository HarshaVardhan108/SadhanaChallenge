"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { temples } from "@/lib/data";
import { MapPin, Navigation, Clock } from "lucide-react";

export default function TempleMapPage() {
  return (
    <div>
      <PageHeader
        title="Temple Locator"
        subtitle="Find nearest temples, schedules, Sunday Feast, and directions."
        emoji="🛕"
      />

      {/* Map placeholder with Vrindavan aesthetic */}
      <GlassCard className="mb-8 overflow-hidden" padding="p-0" lift={false}>
        <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-100 md:h-80">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-1/4 top-1/3 h-4 w-4 rounded-full bg-krishna animate-pulse" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 rounded-full bg-peacock animate-pulse" />
            <div className="absolute right-1/3 top-2/5 h-3 w-3 rounded-full bg-saffron animate-pulse" />
            <div className="absolute left-2/3 top-1/4 h-4 w-4 rounded-full bg-tulasi animate-pulse" />
          </div>
          <div className="relative z-10 text-center">
            <p className="text-5xl">🗺️</p>
            <p className="mt-2 font-serif text-lg font-bold text-krishna">
              Interactive Temple Map
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Map integration ready for Google Maps / Mapbox
            </p>
          </div>
        </div>
      </GlassCard>

      <h2 className="mb-4 font-serif text-xl font-bold text-krishna">Nearest Temples</h2>
      <div className="space-y-4">
        {temples.map((t) => (
          <GlassCard key={t.name} className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-krishna/10 text-2xl">
              🛕
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold text-krishna">{t.name}</h3>
              <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <MapPin className="h-3.5 w-3.5" />
                {t.city}, {t.country} · {t.distance}
              </p>
              <p className="mt-1 flex items-start gap-1 text-xs text-peacock">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t.programs}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
              <Button variant="outline" size="sm">
                Schedule
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
