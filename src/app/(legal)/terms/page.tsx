"use client";

import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-cream">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16">
        <Link href="/dashboard" className="text-sm text-krishna hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-krishna">Terms of Service</h1>
        <GlassCard className="mt-8 space-y-4 text-sm leading-relaxed" strong>
          <p>
            By using Sadhana Challenge you agree to engage respectfully in the spirit of
            Krishna consciousness — encouraging chanting, reading, hearing, and seva.
          </p>
          <p>
            Leaderboards and challenges are meant to inspire devotion, not ego. Content
            shared in community must remain pure, kind, and aligned with Vaishnava etiquette.
          </p>
          <p>
            Spiritual guidance remains with your guru, temple authorities, and Srila
            Prabhupada&apos;s books. This platform is a tool for practice, not a substitute
            for personal guidance.
          </p>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
