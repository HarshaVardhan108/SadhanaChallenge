"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Copy, Mail, MessageCircle, QrCode, Users } from "lucide-react";

const methods = [
  { name: "Copy Link", icon: Copy, desc: "Share your invite URL", pts: 50 },
  { name: "QR Code", icon: QrCode, desc: "Show at temple", pts: 50 },
  { name: "WhatsApp", icon: MessageCircle, desc: "Message friends", pts: 75 },
  { name: "Telegram", icon: MessageCircle, desc: "Send to channel", pts: 75 },
  { name: "Email", icon: Mail, desc: "Invite by email", pts: 60 },
  { name: "Temple Group", icon: Users, desc: "Share with sanga", pts: 100 },
];

export default function InvitePage() {
  return (
    <div>
      <PageHeader
        title="Invite Devotees"
        subtitle="Each invite earns Lotus Points — expand the circle of bhakti."
        emoji="💌"
      />

      <GlassCard gold className="mb-6 text-center sm:mb-8" lift={false}>
        <p className="text-sm text-peacock">Your Lotus Points from invites</p>
        <p className="font-serif text-4xl font-bold text-krishna">0</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">0 devotees joined yet — invite someone!</p>
      </GlassCard>

      <GlassCard className="mb-8" strong>
        <p className="text-sm font-medium text-krishna">Your invite link</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value="https://bhaktichallenge.app/join/harsha-vrnd"
            className="font-mono text-xs"
          />
          <Button variant="gold" className="shrink-0">
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
      </GlassCard>

      {/* QR placeholder */}
      <div className="mb-8 flex justify-center">
        <GlassCard className="text-center" padding="p-8">
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-gold/50 bg-white/60 text-6xl">
            ▦
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">Scan to join Bhakti Challenge</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((m) => {
          const Icon = m.icon;
          return (
            <GlassCard key={m.name} padding="p-5" className="flex flex-col items-start">
              <Icon className="h-6 w-6 text-krishna" />
              <h3 className="mt-3 font-semibold text-krishna">{m.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">{m.desc}</p>
              <p className="mt-2 text-xs font-medium text-peacock">+{m.pts} Lotus Points</p>
              <Button variant="outline" size="sm" className="mt-4">
                Invite
              </Button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
