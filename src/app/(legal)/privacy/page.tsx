"use client";

import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-cream">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16">
        <Link href="/dashboard" className="text-sm text-krishna hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-krishna">Privacy Policy</h1>
        <GlassCard className="mt-8 prose-sm space-y-4" strong>
          <p>
            Bhakti Challenge respects your privacy. We collect only what is needed to support
            your spiritual practice — name, email, temple affiliation, and sadhana progress.
          </p>
          <p>
            We do not sell personal data. Authentication may use Google OAuth or Firebase.
            Progress data is stored securely (PostgreSQL / cloud storage).
          </p>
          <p>
            You may request account deletion at any time via Contact. All glories to serving
            devotees with trust and care.
          </p>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
