"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ShlokaTrack = {
  id: string;
  label: string;
  audioUrl: string;
  chapter: number;
  verseNumber: number;
  bookName?: string;
  transliteration?: string;
  sanskrit?: string;
};

type ShlokaAudioContextValue = {
  track: ShlokaTrack | null;
  queue: ShlokaTrack[];
  queueIndex: number;
  playing: boolean;
  loop: boolean;
  muted: boolean;
  progress: number;
  duration: number;
  audioError: boolean;
  /** True after user starts playback at least once this session. */
  sessionActive: boolean;
  setQueue: (tracks: ShlokaTrack[], startIndex?: number) => void;
  selectIndex: (index: number, autoPlay?: boolean) => void;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  setLoop: (v: boolean | ((prev: boolean) => boolean)) => void;
  setMuted: (v: boolean | ((prev: boolean) => boolean)) => void;
  seek: (seconds: number) => void;
  goPrev: () => void;
  goNext: () => void;
  dismiss: () => void;
};

const ShlokaAudioContext = createContext<ShlokaAudioContextValue | null>(null);

function formatMediaTitle(track: ShlokaTrack): string {
  return track.label || `BG ${track.chapter}.${track.verseNumber}`;
}

export function ShlokaAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<ShlokaTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [track, setTrack] = useState<ShlokaTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const wantPlayRef = useRef(false);
  const queueRef = useRef<ShlokaTrack[]>([]);
  const queueIndexRef = useRef(0);
  const loopRef = useRef(false);
  const trackRef = useRef<ShlokaTrack | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);
  useEffect(() => {
    trackRef.current = track;
  }, [track]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const applyTrack = useCallback((next: ShlokaTrack | null, autoPlay: boolean) => {
    const el = audioRef.current;
    const prev = trackRef.current;

    // Same track already loaded — do not restart mid-playback
    if (next && prev && next.id === prev.id && next.audioUrl === prev.audioUrl) {
      if (autoPlay && el?.paused) {
        wantPlayRef.current = true;
        setSessionActive(true);
        void el
          .play()
          .then(() => {
            setPlaying(true);
            playingRef.current = true;
            setAudioError(false);
          })
          .catch(() => {
            setPlaying(false);
            playingRef.current = false;
            setAudioError(true);
            wantPlayRef.current = false;
          });
      }
      return;
    }

    setTrack(next);
    trackRef.current = next;
    setProgress(0);
    setDuration(0);
    setAudioError(false);
    wantPlayRef.current = autoPlay;

    if (!el) return;

    el.pause();
    el.currentTime = 0;

    if (!next?.audioUrl) {
      el.removeAttribute("src");
      el.load();
      setPlaying(false);
      playingRef.current = false;
      return;
    }

    el.src = next.audioUrl;
    el.load();

    if (autoPlay) {
      setSessionActive(true);
      void el
        .play()
        .then(() => {
          setPlaying(true);
          playingRef.current = true;
          setAudioError(false);
        })
        .catch(() => {
          setPlaying(false);
          playingRef.current = false;
          setAudioError(true);
          wantPlayRef.current = false;
        });
    } else {
      setPlaying(false);
      playingRef.current = false;
    }
  }, []);

  const setQueue = useCallback(
    (tracks: ShlokaTrack[], startIndex = 0) => {
      const safe =
        tracks.length === 0
          ? 0
          : Math.max(0, Math.min(tracks.length - 1, startIndex));
      setQueueState(tracks);
      queueRef.current = tracks;
      setQueueIndex(safe);
      queueIndexRef.current = safe;
      const next = tracks[safe] ?? null;
      const cur = trackRef.current;
      // Keep current playback if same track already loaded
      if (next && cur?.id === next.id && cur.audioUrl === next.audioUrl) {
        return;
      }
      applyTrack(next, wantPlayRef.current || playingRef.current);
    },
    [applyTrack]
  );

  const selectIndex = useCallback(
    (index: number, autoPlay = false) => {
      const tracks = queueRef.current;
      if (tracks.length === 0) return;
      const safe = Math.max(0, Math.min(tracks.length - 1, index));
      setQueueIndex(safe);
      queueIndexRef.current = safe;
      const next = tracks[safe];
      if (!next) return;
      const cur = trackRef.current;
      if (cur?.id === next.id && cur.audioUrl === next.audioUrl) {
        if (autoPlay) {
          wantPlayRef.current = true;
          setSessionActive(true);
          void audioRef.current
            ?.play()
            .then(() => {
              setPlaying(true);
              playingRef.current = true;
            })
            .catch(() => {
              setPlaying(false);
              playingRef.current = false;
              setAudioError(true);
            });
        }
        return;
      }
      applyTrack(
        next,
        autoPlay || wantPlayRef.current || playingRef.current
      );
    },
    [applyTrack]
  );

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el || !track?.audioUrl) return;
    wantPlayRef.current = true;
    setSessionActive(true);
    try {
      await el.play();
      setPlaying(true);
      setAudioError(false);
    } catch {
      setPlaying(false);
      setAudioError(true);
    }
  }, [track?.audioUrl]);

  const pause = useCallback(() => {
    wantPlayRef.current = false;
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (playing) {
      pause();
      return;
    }
    await play();
  }, [pause, play, playing]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(seconds)) return;
    const d = el.duration;
    const next =
      Number.isFinite(d) && d > 0
        ? Math.max(0, Math.min(d, seconds))
        : Math.max(0, seconds);
    el.currentTime = next;
    setProgress(next);
  }, []);

  const goPrev = useCallback(() => {
    const tracks = queueRef.current;
    const i = queueIndexRef.current;
    if (tracks.length === 0) return;
    const el = audioRef.current;
    // Restart current if more than 3s in
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      setProgress(0);
      return;
    }
    const nextIndex = Math.max(0, i - 1);
    setQueueIndex(nextIndex);
    applyTrack(tracks[nextIndex] ?? null, wantPlayRef.current || playing);
  }, [applyTrack, playing]);

  const goNext = useCallback(() => {
    const tracks = queueRef.current;
    const i = queueIndexRef.current;
    if (tracks.length === 0) return;
    if (i >= tracks.length - 1) {
      if (loopRef.current && tracks[0]) {
        setQueueIndex(0);
        applyTrack(tracks[0], wantPlayRef.current || playing);
      }
      return;
    }
    const nextIndex = i + 1;
    setQueueIndex(nextIndex);
    applyTrack(tracks[nextIndex] ?? null, wantPlayRef.current || playing);
  }, [applyTrack, playing]);

  const dismiss = useCallback(() => {
    wantPlayRef.current = false;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setPlaying(false);
    setTrack(null);
    setProgress(0);
    setDuration(0);
    setAudioError(false);
    setSessionActive(false);
  }, []);

  // Keep loop / mute in sync with element
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = loop;
    el.muted = muted;
  }, [loop, muted]);

  // Media Session — lock screen / OS controls / background resume
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;

    if (!track) {
      ms.metadata = null;
      return;
    }

    try {
      ms.metadata = new MediaMetadata({
        title: formatMediaTitle(track),
        artist: track.bookName || "Bhagavad Gita",
        album: "Bhakti Challenge · Shlokas",
        artwork: [
          {
            src: "/vrindavan-krishna.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });
    } catch {
      /* older browsers */
    }

    const bind = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    };

    bind("play", () => {
      void play();
    });
    bind("pause", () => {
      pause();
    });
    bind("previoustrack", () => {
      goPrev();
    });
    bind("nexttrack", () => {
      goNext();
    });
    bind("seekto", (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
    bind("seekbackward", (details) => {
      const el = audioRef.current;
      if (!el) return;
      seek(el.currentTime - (details.seekOffset ?? 10));
    });
    bind("seekforward", (details) => {
      const el = audioRef.current;
      if (!el) return;
      seek(el.currentTime + (details.seekOffset ?? 10));
    });

    return () => {
      bind("play", null);
      bind("pause", null);
      bind("previoustrack", null);
      bind("nexttrack", null);
      bind("seekto", null);
      bind("seekbackward", null);
      bind("seekforward", null);
    };
  }, [track, play, pause, goPrev, goNext, seek]);

  // Playback state for Media Session + position
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    try {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      /* ignore */
    }
    if (duration > 0 && Number.isFinite(progress)) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(progress, duration),
        });
      } catch {
        /* ignore */
      }
    }
  }, [playing, progress, duration]);

  // Do NOT pause on tab hide / app switch — allow background playback
  useEffect(() => {
    const onVisibility = () => {
      // Intentionally empty: keep audio running when document is hidden
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const value = useMemo<ShlokaAudioContextValue>(
    () => ({
      track,
      queue,
      queueIndex,
      playing,
      loop,
      muted,
      progress,
      duration,
      audioError,
      sessionActive,
      setQueue,
      selectIndex,
      play,
      pause,
      togglePlay,
      setLoop,
      setMuted,
      seek,
      goPrev,
      goNext,
      dismiss,
    }),
    [
      track,
      queue,
      queueIndex,
      playing,
      loop,
      muted,
      progress,
      duration,
      audioError,
      sessionActive,
      setQueue,
      selectIndex,
      play,
      pause,
      togglePlay,
      seek,
      goPrev,
      goNext,
      dismiss,
    ]
  );

  return (
    <ShlokaAudioContext.Provider value={value}>
      {/*
        Persistent element lives at app shell level so playback survives
        route changes. playsInline + no controls keeps mobile background-friendly.
      */}
      <audio
        ref={(node) => {
          audioRef.current = node;
          if (node) {
            node.setAttribute("playsinline", "true");
            node.setAttribute("webkit-playsinline", "true");
          }
        }}
        preload="metadata"
        playsInline
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          if (wantPlayRef.current) {
            void e.currentTarget
              .play()
              .then(() => {
                setPlaying(true);
                setAudioError(false);
              })
              .catch(() => {
                setPlaying(false);
                setAudioError(true);
              });
          }
        }}
        onEnded={() => {
          if (loopRef.current) {
            // native loop handles single-track; keep playing state
            setPlaying(true);
            return;
          }
          const tracks = queueRef.current;
          const i = queueIndexRef.current;
          if (i < tracks.length - 1) {
            const nextIndex = i + 1;
            setQueueIndex(nextIndex);
            applyTrack(tracks[nextIndex] ?? null, true);
          } else {
            setPlaying(false);
            wantPlayRef.current = false;
          }
        }}
        onPlay={() => {
          setPlaying(true);
          playingRef.current = true;
        }}
        onPause={() => {
          // Reflect real element state (OS may pause briefly; UI stays truthful)
          setPlaying(false);
          playingRef.current = false;
        }}
        onError={() => {
          setAudioError(true);
          setPlaying(false);
          playingRef.current = false;
          wantPlayRef.current = false;
        }}
      />
      {children}
    </ShlokaAudioContext.Provider>
  );
}

export function useShlokaAudio(): ShlokaAudioContextValue {
  const ctx = useContext(ShlokaAudioContext);
  if (!ctx) {
    throw new Error("useShlokaAudio must be used within ShlokaAudioProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (returns null). */
export function useShlokaAudioOptional(): ShlokaAudioContextValue | null {
  return useContext(ShlokaAudioContext);
}
