"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Pink/white lotus with gold ring — style guide “Day X/Y · % Complete”. */
export function LotusProgress({
  completed = 7,
  total = 21,
  size = 220,
  className,
  title = "21 DAYS CHALLENGE",
}: {
  completed?: number;
  total?: number;
  size?: number;
  className?: string;
  title?: string;
}) {
  const petals = 12;
  const bloomed = Math.min(petals, Math.round((completed / total) * petals));
  const percent = Math.round((completed / total) * 100);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {title && (
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-peacock sm:text-xs">
          {title}
        </p>
      )}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer gold ring (style guide) */}
        <div
          className="absolute inset-0 rounded-full p-[3px]"
          style={{
            background:
              "linear-gradient(135deg, #FFD54F, #FFE082 40%, #C9A227 70%, #FFD54F)",
            boxShadow: "0 8px 28px rgba(255,213,79,0.3)",
          }}
        >
          <div className="h-full w-full rounded-full bg-cream" />
        </div>
        <div
          className="absolute inset-[3px] rounded-full border border-gold/30"
          style={{
            boxShadow: "inset 0 0 24px rgba(255,192,203,0.35)",
          }}
        />

        {/* Soft glow */}
        <div
          className="absolute inset-6 rounded-full animate-glow-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(255,192,203,0.55) 0%, rgba(255,213,79,0.2) 45%, transparent 70%)",
          }}
        />

        <svg viewBox="0 0 200 200" className="relative h-full w-full drop-shadow-md">
          {[...Array(petals)].map((_, i) => {
            const angle = (i * 360) / petals - 90;
            const isBloomed = i < bloomed;
            const rad = (angle * Math.PI) / 180;
            const cx = 100 + Math.cos(rad) * 40;
            const cy = 100 + Math.sin(rad) * 40;

            return (
              <motion.ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx={17}
                ry={34}
                transform={`rotate(${angle + 90} ${cx} ${cy})`}
                initial={false}
                animate={{
                  scale: isBloomed ? 1 : 0.55,
                  opacity: isBloomed ? 1 : 0.4,
                }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
                fill={
                  isBloomed
                    ? i % 2 === 0
                      ? "url(#petalPinkGuide)"
                      : "url(#petalWhiteGuide)"
                    : "rgba(255,255,255,0.55)"
                }
                stroke={isBloomed ? "rgba(255,182,193,0.9)" : "rgba(255,213,79,0.35)"}
                strokeWidth="0.7"
              />
            );
          })}

          <circle cx="100" cy="100" r="36" fill="url(#centerGold)" />
          <circle cx="100" cy="100" r="30" fill="#FAFAFA" />
          <text
            x="100"
            y="96"
            textAnchor="middle"
            fontSize="11"
            fill="#2A2E6E"
            fontFamily="var(--font-baskerville), Georgia, serif"
          >
            Day
          </text>
          <text
            x="100"
            y="114"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#1A4FA3"
            fontFamily="var(--font-baskerville), Georgia, serif"
          >
            {completed}/{total}
          </text>

          <defs>
            <radialGradient id="petalPinkGuide" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFF0F5" />
              <stop offset="55%" stopColor="#FFC0CB" />
              <stop offset="100%" stopColor="#FF8FAB" />
            </radialGradient>
            <radialGradient id="petalWhiteGuide" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFD6E0" />
            </radialGradient>
            <radialGradient id="centerGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#FFD54F" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <p className="mt-2 text-sm font-medium text-peacock">{percent}% Complete</p>
    </div>
  );
}
