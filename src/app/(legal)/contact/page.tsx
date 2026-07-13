"use client";

import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-cream">
      <div className="relative z-10 mx-auto max-w-xl px-4 py-16">
        <Link href="/dashboard" className="text-sm text-krishna hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-krishna">Contact</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          We would love to hear from you. Hare Krishna!
        </p>
        <GlassCard className="mt-8" strong>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you! We will respond soon. Haribol 🙏");
            }}
          >
            <Input label="Name" required />
            <Input label="Email" type="email" required />
            <Textarea label="Message" required placeholder="How can we serve you?" />
            <Button type="submit" variant="gold" fullWidth>
              Send Message
            </Button>
          </form>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}
