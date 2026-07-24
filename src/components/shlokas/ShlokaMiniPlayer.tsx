"use client";

import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useShlokaAudioOptional } from "./ShlokaAudioProvider";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Compact sticky player at the top of the screen on mobile.
 * Stays visible while shloka audio is active (even on other routes).
 */
export function ShlokaMiniPlayer() {
  const audio = useShlokaAudioOptional();
  if (!audio?.sessionActive || !audio.track) return null;

  const {
    track,
    playing,
    progress,
    duration,
    queue,
    queueIndex,
    togglePlay,
    goPrev,
    goNext,
    dismiss,
    seek,
  } = audio;

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const canPrev = queueIndex > 0 || progress > 3;
  const canNext = queueIndex < queue.length - 1;

  return (
    <div
      className={cn(
        "sticky top-14 z-40 border-b border-krishna/25 bg-gradient-to-r from-krishna via-[#1a4fa3] to-peacock text-white shadow-md",
        "sm:top-16",
        // Mobile-first: always show when active; compact on small screens
        "block"
      )}
      role="region"
      aria-label="Shloka audio player"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        <Link
          href="/shlokas"
          className="min-w-0 flex-1 active:opacity-90"
          title="Open Shlokas"
        >
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/75">
            Now playing
            {track.bookName ? ` · ${track.bookName}` : ""}
          </p>
          <p className="truncate text-sm font-semibold leading-tight">
            {track.label}
            {track.transliteration
              ? ` · ${track.transliteration.slice(0, 42)}${track.transliteration.length > 42 ? "…" : ""}`
              : ""}
          </p>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            aria-label="Previous verse"
            disabled={!canPrev}
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition active:bg-white/15 disabled:opacity-35"
          >
            <SkipBack className="h-4 w-4" fill="currentColor" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => void togglePlay()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-krishna shadow-md transition active:scale-95"
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next verse"
            disabled={!canNext}
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition active:bg-white/15 disabled:opacity-35"
          >
            <SkipForward className="h-4 w-4" fill="currentColor" />
          </button>
          <button
            type="button"
            aria-label="Close player"
            onClick={dismiss}
            className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition active:bg-white/15 sm:ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrub bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-2 pb-1.5 sm:px-4">
        <span className="w-8 shrink-0 text-right text-[9px] tabular-nums text-white/70 sm:w-9 sm:text-[10px]">
          {formatTime(progress)}
        </span>
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.1}
          value={Math.min(progress, duration || 0)}
          aria-label="Seek"
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1 w-full flex-1 cursor-pointer appearance-none rounded-full bg-white/25 accent-gold [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
          style={{
            background: `linear-gradient(to right, #ffd54f 0%, #ffd54f ${pct}%, rgba(255,255,255,0.25) ${pct}%, rgba(255,255,255,0.25) 100%)`,
          }}
        />
        <span className="w-8 shrink-0 text-[9px] tabular-nums text-white/70 sm:w-9 sm:text-[10px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
