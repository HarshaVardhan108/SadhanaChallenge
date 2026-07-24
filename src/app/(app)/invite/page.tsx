"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isGuestUser } from "@/lib/guest";
import {
  Check,
  Copy,
  Loader2,
  LogIn,
  Mail,
  MessageCircle,
  QrCode,
  Share2,
  Users,
} from "lucide-react";

type InviteData = {
  url: string;
  code: string;
  joined: number;
  points: number;
  shareText: string;
  recent: { fullName: string; createdAt: string }[];
};

export default function InvitePage() {
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [data, setData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isGuestUser()) {
        setIsGuest(true);
        setLoading(false);
        return;
      }
      setIsGuest(false);
      const res = await fetch("/api/invite", { credentials: "include" });
      const json = (await res.json()) as InviteData & { error?: string };
      if (!res.ok) {
        setError(json.error || "Could not load invite link.");
        setLoading(false);
        return;
      }
      setData({
        url: json.url,
        code: json.code,
        joined: json.joined ?? 0,
        points: json.points ?? 0,
        shareText: json.shareText,
        recent: json.recent || [],
      });
    } catch {
      setError("Network error loading invite link.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = data.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bhakti Challenge",
          text: data.shareText,
          url: data.url,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await copyLink();
    }
  };

  const whatsappUrl = data
    ? `https://wa.me/?text=${encodeURIComponent(data.shareText)}`
    : "#";
  const telegramUrl = data
    ? `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent("Hare Krishna! Join me on Bhakti Challenge.")}`
    : "#";
  const emailUrl = data
    ? `mailto:?subject=${encodeURIComponent("Join me on Bhakti Challenge")}&body=${encodeURIComponent(data.shareText)}`
    : "#";
  const qrSrc = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(data.url)}`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-krishna" />
        Loading your invite link…
      </div>
    );
  }

  if (isGuest) {
    return (
      <div>
        <PageHeader
          title="Invite Devotees"
          subtitle="Share Bhakti Challenge with your sanga."
          emoji="💌"
        />
        <GlassCard strong padding="p-6" className="mx-auto max-w-md text-center">
          <LogIn className="mx-auto h-9 w-9 text-peacock" />
          <h2 className="mt-3 font-serif text-lg font-bold text-krishna">
            Log in to get your invite link
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Each devotee gets a personal link to share.
          </p>
          <Link href="/please-login?reason=invite&next=/invite" className="mt-5 inline-block">
            <Button variant="primary">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite Devotees"
        subtitle="Share your personal link — grow the circle of bhakti."
        emoji="💌"
      />

      {error && (
        <GlassCard className="mb-4 border-rose-200" padding="p-4">
          <p className="text-sm text-rose-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void load()}>
            Retry
          </Button>
        </GlassCard>
      )}

      <GlassCard gold className="mb-6 text-center sm:mb-8" lift={false}>
        <p className="text-sm text-peacock">Your Lotus Points from invites</p>
        <p className="font-serif text-4xl font-bold text-krishna">
          {data?.points ?? 0}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {data?.joined === 0
            ? "0 devotees joined yet — invite someone!"
            : `${data?.joined} devotee${data?.joined === 1 ? "" : "s"} joined via your link · 50 pts each`}
        </p>
      </GlassCard>

      <GlassCard className="mb-6" strong>
        <p className="text-sm font-medium text-krishna">Your invite link</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
          Code: <span className="font-mono font-semibold text-peacock">{data?.code}</span>
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value={data?.url || ""}
            className="font-mono text-xs"
            onFocus={(e) => e.target.select()}
          />
          <Button variant="gold" className="shrink-0" onClick={() => void copyLink()}>
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy
              </>
            )}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => void shareNative()}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </Button>
          </a>
          <a href={emailUrl}>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </a>
        </div>
      </GlassCard>

      {/* QR */}
      <div className="mb-8 flex justify-center">
        <GlassCard className="text-center" padding="p-6">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrSrc}
              alt="Invite QR code"
              width={200}
              height={200}
              className="mx-auto rounded-xl border border-gold/30 bg-white p-2"
            />
          ) : (
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-gold/50 bg-white/60">
              <QrCode className="h-10 w-10 text-[var(--text-muted)]" />
            </div>
          )}
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Scan to join Bhakti Challenge
          </p>
        </GlassCard>
      </div>

      {data && data.recent.length > 0 && (
        <GlassCard className="mb-6" lift={false}>
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-krishna">
            <Users className="h-5 w-5 text-peacock" />
            Joined via your link
          </h2>
          <ul className="mt-3 divide-y divide-gold/20">
            {data.recent.map((r) => (
              <li
                key={r.fullName + r.createdAt}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium text-krishna">{r.fullName}</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
