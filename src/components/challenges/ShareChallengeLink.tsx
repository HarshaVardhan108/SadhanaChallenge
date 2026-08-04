"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  challengeShareText,
  challengeShareUrl,
} from "@/lib/challenges";
import {
  Check,
  Copy,
  Link2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";

type ShareChallengeLinkProps = {
  challengeId: string;
  challengeName: string;
  /** Emphasize the panel right after create (e.g. ?share=1) */
  emphasize?: boolean;
  className?: string;
};

/**
 * Public share link for a challenge: copy, native share, WhatsApp, Telegram, email.
 */
export function ShareChallengeLink({
  challengeId,
  challengeName,
  emphasize = false,
  className,
}: ShareChallengeLinkProps) {
  const [url, setUrl] = useState(() => challengeShareUrl(challengeId));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(challengeShareUrl(challengeId));
  }, [challengeId]);

  const shareText = useMemo(
    () => challengeShareText(challengeName, challengeId),
    [challengeName, challengeId]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: challengeName || "Sadhana Challenge",
          text: shareText,
          url,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
    `Hare Krishna! Join my challenge “${challengeName || "Sadhana Challenge"}”.`
  )}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Join “${challengeName || "my challenge"}” on Sadhana Challenge`
  )}&body=${encodeURIComponent(shareText)}`;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        emphasize
          ? "border-peacock/40 bg-peacock/10 shadow-md shadow-peacock/10 ring-2 ring-peacock/20"
          : "border-gold/35 bg-cream/40",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Link2
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            emphasize ? "text-peacock" : "text-krishna"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-krishna">
            {emphasize ? "Public link ready to share" : "Public share link"}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
            Anyone with this link can open the challenge and join after login.
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={url}
          className="font-mono text-xs"
          aria-label="Public challenge link"
          onFocus={(e) => e.target.select()}
        />
        <Button
          type="button"
          variant="gold"
          className="shrink-0"
          onClick={() => void copyLink()}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </Button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => void shareNative()}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" size="sm">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>
        <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="outline" size="sm">
            <MessageCircle className="h-4 w-4" />
            Telegram
          </Button>
        </a>
        <a href={emailUrl}>
          <Button type="button" variant="outline" size="sm">
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </a>
      </div>
    </div>
  );
}
