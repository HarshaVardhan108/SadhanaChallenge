"use client";

import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LottieLotus } from "@/components/ambient/LottieLotus";

export default function DonatePage() {
  return (
    <div className="relative min-h-screen bg-cream">
      <div className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center">
        <Link href="/dashboard" className="text-sm text-krishna hover:underline">
          ← Back
        </Link>
        <div className="mt-6 flex justify-center">
          <LottieLotus size={140} />
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold text-krishna">Donate</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Support the expansion of Krishna consciousness through technology and seva.
        </p>
        <GlassCard className="mt-8" gold>
          <p className="font-serif text-lg text-krishna">
            Your contribution helps host lectures, build features, and serve devotees worldwide.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["₹108", "₹1008", "₹5000"].map((amt) => (
              <Button key={amt} variant="outline" className="font-serif text-lg">
                {amt}
              </Button>
            ))}
          </div>
          <Button variant="gold" fullWidth size="lg" className="mt-6">
            Offer Seva Donation 💛
          </Button>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Payment gateway integration ready for Razorpay / Stripe
          </p>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
