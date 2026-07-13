"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { communityPosts } from "@/lib/data";
import { MessageCircle, Image, MapPin, Heart } from "lucide-react";

export default function CommunityPage() {
  const [posts, setPosts] = useState(communityPosts);
  const [draft, setDraft] = useState("");

  const react = (id: number, type: "haribol" | "jaiPrabhupada") => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              reactions: {
                ...p.reactions,
                [type]: p.reactions[type] + 1,
              },
            }
          : p
      )
    );
  };

  return (
    <div>
      <PageHeader
        title="Community"
        subtitle="Share realizations, seva, temple visits, and festival joy."
        emoji="🌺"
      />

      <GlassCard className="mb-8" strong>
        <Textarea
          label="Share with devotees"
          placeholder="Write a realization, seva update, or festival moment..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 text-[var(--text-muted)]">
            <button type="button" className="rounded-lg p-2 hover:bg-white/50" aria-label="Photo">
              <Image className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-white/50" aria-label="Location">
              <MapPin className="h-4 w-4" />
            </button>
            <span className="self-center text-xs">Realizations · Photos · Seva · Festivals</span>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              if (!draft.trim()) return;
              setPosts([
                {
                  id: Date.now(),
                  author: "Harsha",
                  avatar: "🙏",
                  time: "Just now",
                  type: "realization",
                  content: draft,
                  reactions: { haribol: 0, jaiPrabhupada: 0 },
                  comments: 0,
                },
                ...posts,
              ]);
              setDraft("");
            }}
          >
            Share
          </Button>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {posts.map((post) => (
          <GlassCard key={post.id}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/30 text-xl">
                {post.avatar}
              </span>
              <div>
                <p className="font-semibold text-krishna">{post.author}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {post.time} · {post.type}
                </p>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-[var(--text-primary)]">{post.content}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => react(post.id, "haribol")}
                className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-3 py-1.5 text-sm transition hover:bg-cream"
              >
                <Heart className="h-3.5 w-3.5 text-lotus" />
                Haribol · {post.reactions.haribol}
              </button>
              <button
                type="button"
                onClick={() => react(post.id, "jaiPrabhupada")}
                className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-3 py-1.5 text-sm transition hover:bg-cream"
              >
                🙏 Jai Srila Prabhupada · {post.reactions.jaiPrabhupada}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {post.comments} comments
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
