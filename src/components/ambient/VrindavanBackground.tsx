"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Petal = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  sway: number;
};

type Sparkle = {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
};

const PETAL_COLORS = ["#FFC0CB", "#FFB6C1", "#FFD54F", "#FFCCCB", "#F8BBD9", "#FFE082"];

export function VrindavanBackground({
  variant = "default",
  intensity = "medium",
}: {
  variant?: "default" | "login" | "minimal";
  intensity?: "low" | "medium" | "high";
}) {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mounted, setMounted] = useState(false);

  const count = intensity === "low" ? 8 : intensity === "high" ? 22 : 14;

  useEffect(() => {
    setMounted(true);
    setPetals(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 14,
        size: 8 + Math.random() * 14,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
        sway: 20 + Math.random() * 40,
      }))
    );
    setSparkles(
      Array.from({ length: count + 6 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: 2 + Math.random() * 3,
      }))
    );
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Sky gradient */}
      <div
        className={`absolute inset-0 ${
          variant === "login" ? "vrindavan-login" : "vrindavan-sky"
        }`}
      />

      {/* Divine light rays */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 left-1/2 h-[120%] w-16 origin-top animate-glow-pulse"
            style={{
              background: `linear-gradient(180deg, rgba(255,213,79,0.35) 0%, transparent 70%)`,
              transform: `translateX(-50%) rotate(${(i - 3) * 12}deg)`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Soft sun glow */}
      <div
        className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,213,79,0.7) 0%, rgba(255,179,71,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Clouds */}
      {variant !== "minimal" && (
        <>
          <Cloud top="8%" delay={0} duration={80} scale={1.2} />
          <Cloud top="16%" delay={20} duration={100} scale={0.9} />
          <Cloud top="12%" delay={45} duration={90} scale={1.1} />
        </>
      )}

      {/* Distant temple silhouettes */}
      {variant !== "minimal" && (
        <div className="absolute bottom-[18%] left-0 right-0 flex items-end justify-center gap-8 opacity-25">
          <TempleSilhouette className="h-24 w-16" />
          <TempleSilhouette className="h-36 w-24" />
          <TempleSilhouette className="h-28 w-20" />
        </div>
      )}

      {/* Yamuna river band + water ripples */}
      {variant !== "minimal" && (
        <div className="absolute bottom-[12%] left-0 right-0 h-16 river-band opacity-50 blur-[1px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute rounded-full border border-sky-200/60 animate-water-ripple"
              style={{
                left: `${15 + i * 22}%`,
                top: "30%",
                width: 28 + i * 6,
                height: 10 + i * 2,
                animationDelay: `${i * 0.9}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Garden / grass base */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[22%]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(111,191,115,0.35) 30%, rgba(76,175,80,0.45) 100%)",
        }}
      />

      {/* Kadamba / tulasi trees gently swaying */}
      {variant !== "minimal" && (
        <>
          <span className="absolute bottom-[16%] left-[4%] text-5xl opacity-45 animate-tree-sway">
            🌳
          </span>
          <span
            className="absolute bottom-[15%] right-[5%] text-4xl opacity-40 animate-tree-sway"
            style={{ animationDelay: "1.2s" }}
          >
            🌳
          </span>
          <span className="absolute bottom-[18%] left-[28%] text-2xl opacity-50 animate-sway">
            🌿
          </span>
        </>
      )}

      {/* Temple bells swinging */}
      {variant !== "minimal" && (
        <>
          <span className="absolute bottom-[28%] left-[42%] text-xl opacity-50 animate-bell">
            🔔
          </span>
          <span
            className="absolute bottom-[30%] left-[55%] text-lg opacity-40 animate-bell"
            style={{ animationDelay: "0.6s" }}
          >
            🔔
          </span>
        </>
      )}

      {/* Diyas glowing */}
      {variant !== "minimal" && (
        <>
          <span className="absolute bottom-[20%] left-[35%] text-xl opacity-70 animate-diya">
            🪔
          </span>
          <span
            className="absolute bottom-[19%] right-[32%] text-lg opacity-65 animate-diya"
            style={{ animationDelay: "0.4s" }}
          >
            🪔
          </span>
        </>
      )}

      {/* Floating lotus on water */}
      {variant !== "minimal" && (
        <div className="absolute bottom-[14%] left-[12%] animate-float-slow text-3xl opacity-70">
          🪷
        </div>
      )}
      {variant !== "minimal" && (
        <div
          className="absolute bottom-[15%] right-[18%] animate-float text-2xl opacity-60"
          style={{ animationDelay: "1.5s" }}
        >
          🪷
        </div>
      )}

      {/* Peacock / cow accents */}
      {variant === "login" && (
        <>
          <span className="absolute bottom-[20%] left-[8%] text-3xl opacity-50 animate-sway">
            🦚
          </span>
          <span className="absolute bottom-[18%] right-[10%] text-3xl opacity-45 animate-float-slow">
            🐄
          </span>
          <span
            className="absolute bottom-[22%] left-[22%] text-2xl opacity-40"
            style={{ animation: "sway 5s ease-in-out infinite" }}
          >
            🐄
          </span>
          <span className="absolute bottom-[17%] left-[48%] text-xl opacity-50 animate-float">
            🌸
          </span>
        </>
      )}

      {/* Birds */}
      {variant !== "minimal" && (
        <>
          <span
            className="absolute top-[18%] text-sm opacity-40"
            style={{ animation: "bird-fly 28s linear infinite" }}
          >
            🕊️
          </span>
          <span
            className="absolute top-[24%] text-xs opacity-35"
            style={{ animation: "bird-fly 36s linear infinite", animationDelay: "8s" }}
          >
            🕊️
          </span>
        </>
      )}

      {/* Butterflies */}
      {variant !== "minimal" && (
        <>
          <motion.span
            className="absolute top-[40%] left-[15%] text-lg"
            animate={{ x: [0, 40, 10, 50, 0], y: [0, -20, 10, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          >
            🦋
          </motion.span>
          <motion.span
            className="absolute top-[35%] right-[20%] text-base"
            animate={{ x: [0, -30, 15, -20, 0], y: [0, 15, -10, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            🦋
          </motion.span>
        </>
      )}

      {/* Falling petals */}
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-full opacity-80"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.7,
            background: p.color,
            borderRadius: "50% 50% 50% 0",
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
            filter: "blur(0.3px)",
          }}
        />
      ))}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `sparkle ${2 + (s.id % 3)}s ease-in-out ${s.delay}s infinite`,
            boxShadow: "0 0 6px rgba(255,213,79,0.8)",
          }}
        />
      ))}

      {/* Soft mist */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 opacity-30"
        style={{
          background: "linear-gradient(to top, rgba(255,255,255,0.6), transparent)",
        }}
      />
    </div>
  );
}

function Cloud({
  top,
  delay,
  duration,
  scale,
}: {
  top: string;
  delay: number;
  duration: number;
  scale: number;
}) {
  return (
    <div
      className="absolute opacity-50"
      style={{
        top,
        left: "-20%",
        transform: `scale(${scale})`,
        animation: `cloud-drift ${duration}s linear ${delay}s infinite`,
      }}
    >
      <div className="relative h-10 w-32">
        <div className="absolute bottom-0 left-4 h-8 w-16 rounded-full bg-white/70 blur-[1px]" />
        <div className="absolute bottom-2 left-10 h-10 w-14 rounded-full bg-white/80" />
        <div className="absolute bottom-1 left-20 h-7 w-12 rounded-full bg-white/70" />
      </div>
    </div>
  );
}

function TempleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} fill="rgba(26,47,90,0.5)">
      <path d="M40 5 L50 25 L48 25 L48 30 L55 40 L25 40 L32 30 L32 25 L30 25 Z" />
      <rect x="28" y="40" width="24" height="50" />
      <rect x="18" y="55" width="10" height="35" />
      <rect x="52" y="55" width="10" height="35" />
      <path d="M23 55 L23 48 L18 55 Z" />
      <path d="M57 55 L57 48 L62 55 Z" />
      <rect x="35" y="70" width="10" height="20" rx="1" fill="rgba(255,248,231,0.3)" />
    </svg>
  );
}
