"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { achievements } from "@/lib/data";
import { cn } from "@/lib/utils";

const rarityStyles: Record<string, string> = {
  common: "from-slate-200 to-slate-100 border-slate-300",
  rare: "from-sky-200 to-blue-100 border-sky-400",
  epic: "from-purple-200 to-violet-100 border-purple-400",
  legendary: "from-amber-200 to-yellow-100 border-amber-400",
  mythic: "from-rose-200 via-gold/40 to-pink-100 border-rose-400",
};

export default function AchievementsPage() {
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHeader
        title="Achievements"
        subtitle="Beautiful collectible badges for every step of devotion."
        emoji="🏅"
      />

      <GlassCard gold className="mb-8 text-center">
        <p className="font-serif text-2xl font-bold text-krishna">
          {unlocked} / {achievements.length} badges unlocked
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Every badge is an offering accepted by Krishna
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              className={cn(
                "relative overflow-hidden text-center",
                !a.unlocked && "opacity-55 grayscale"
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 bg-gradient-to-br text-4xl shadow-lg",
                  rarityStyles[a.rarity],
                  a.unlocked && "animate-float"
                )}
                style={a.unlocked ? { animationDelay: `${i * 0.2}s` } : undefined}
              >
                {a.icon}
              </div>
              <h3 className="font-serif text-lg font-bold text-krishna">{a.name}</h3>
              <p className="mt-1 text-xs capitalize text-peacock">{a.rarity}</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{a.desc}</p>
              {a.unlocked && (
                <span className="mt-3 inline-block rounded-full bg-tulasi/20 px-3 py-1 text-xs font-semibold text-green-800">
                  Unlocked ✨
                </span>
              )}
              {!a.unlocked && (
                <span className="mt-3 inline-block rounded-full bg-white/50 px-3 py-1 text-xs text-[var(--text-muted)]">
                  Locked
                </span>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
