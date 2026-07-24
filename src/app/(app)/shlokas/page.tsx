"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pause,
  Play,
  Repeat,
  Volume2,
  VolumeX,
  BookOpen,
  Library,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import type {
  CatalogBook,
  CatalogChapter,
  CatalogShloka,
} from "@/lib/shloka-catalog";
import {
  useShlokaAudio,
  type ShlokaTrack,
} from "@/components/shlokas/ShlokaAudioProvider";
import { cn } from "@/lib/utils";

const COMPLETED_KEY = "bhakti-shlokas-completed";
const FILTER_KEY = "bhakti-shlokas-filters";
const DEFAULT_BOOK_ID = "bg";

type ShlokaRow = CatalogShloka & {
  completed: boolean;
};

function loadCompletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function saveCompletedIds(ids: Set<string>) {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function loadSavedFilters(): { bookId: string; chapter: number | "all" } {
  if (typeof window === "undefined") {
    return { bookId: DEFAULT_BOOK_ID, chapter: "all" };
  }
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return { bookId: DEFAULT_BOOK_ID, chapter: "all" };
    const parsed = JSON.parse(raw) as {
      bookId?: string;
      chapter?: number | "all";
    };
    return {
      bookId: parsed.bookId || DEFAULT_BOOK_ID,
      chapter:
        parsed.chapter === "all" || typeof parsed.chapter === "number"
          ? parsed.chapter
          : "all",
    };
  } catch {
    return { bookId: DEFAULT_BOOK_ID, chapter: "all" };
  }
}

function saveFilters(bookId: string, chapter: number | "all") {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify({ bookId, chapter }));
  } catch {
    /* ignore */
  }
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toTrack(
  s: CatalogShloka,
  bookName?: string
): ShlokaTrack | null {
  if (!s.audioUrl) return null;
  return {
    id: s.id,
    label: s.label,
    audioUrl: s.audioUrl,
    chapter: s.chapter,
    verseNumber: s.verseNumber,
    bookName,
    transliteration: s.transliteration,
    sanskrit: s.sanskrit,
  };
}

export default function ShlokasPage() {
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [allSlokas, setAllSlokas] = useState<ShlokaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"storage" | "local" | null>(null);

  const [bookId, setBookId] = useState(DEFAULT_BOOK_ID);
  const [chapterFilter, setChapterFilter] = useState<number | "all">("all");
  const [index, setIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const {
    track: audioTrack,
    playing,
    loop,
    muted,
    progress,
    duration,
    audioError,
    sessionActive,
    setQueue,
    selectIndex,
    togglePlay,
    setLoop,
    setMuted,
    goPrev: audioPrev,
    goNext: audioNext,
  } = useShlokaAudio();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shlokas");
        const data = (await res.json()) as {
          ok?: boolean;
          source?: "storage" | "local";
          slokas?: CatalogShloka[];
          books?: CatalogBook[];
        };
        if (cancelled) return;

        const done = loadCompletedIds();
        const rows = (data.slokas || []).map((s) => ({
          ...s,
          completed: done.has(s.id),
        }));
        const bookList =
          data.books && data.books.length > 0
            ? data.books
            : [
                {
                  id: DEFAULT_BOOK_ID,
                  name: "Bhagavad Gita As It Is",
                  shortName: "Bhagavad Gita",
                  chapters: [],
                },
              ];

        setAllSlokas(rows);
        setBooks(bookList);
        setSource(data.source ?? "local");

        const saved = loadSavedFilters();
        const validBook =
          bookList.find((b) => b.id === saved.bookId) ??
          bookList.find((b) => b.id === DEFAULT_BOOK_ID) ??
          bookList[0];
        const nextBookId = validBook?.id || DEFAULT_BOOK_ID;
        setBookId(nextBookId);

        const chapters = validBook?.chapters ?? [];
        let nextChapter: number | "all" = saved.chapter;
        if (
          nextChapter !== "all" &&
          !chapters.some((c) => c.number === nextChapter)
        ) {
          nextChapter = chapters[0]?.number ?? "all";
        }
        setChapterFilter(nextChapter);
      } catch {
        if (!cancelled) {
          setAllSlokas([]);
          setBooks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBook: CatalogBook | null = useMemo(() => {
    if (books.length === 0) return null;
    return (
      books.find((b) => b.id === bookId) ??
      books.find((b) => b.id === DEFAULT_BOOK_ID) ??
      books[0]
    );
  }, [books, bookId]);

  const chapters: CatalogChapter[] = activeBook?.chapters ?? [];

  const filtered = useMemo(() => {
    let rows = allSlokas;
    // Default catalog is BG; when more books exist, filter by book if needed.
    // Current catalog is BG-only; keep chapter filter as primary.
    if (chapterFilter !== "all") {
      rows = rows.filter((s) => s.chapter === chapterFilter);
    }
    return rows;
  }, [allSlokas, chapterFilter]);

  // Reset index when filter changes
  useEffect(() => {
    if (filtered.length === 0) {
      setIndex(0);
      return;
    }
    const firstOpen = filtered.findIndex((s) => !s.completed);
    setIndex(firstOpen >= 0 ? firstOpen : 0);
  }, [chapterFilter, bookId, filtered.length]);

  // Persist filters
  useEffect(() => {
    if (loading) return;
    saveFilters(bookId, chapterFilter);
  }, [bookId, chapterFilter, loading]);

  const current = filtered[index] ?? null;
  const total = filtered.length;
  const completedInFilter = filtered.filter((s) => s.completed).length;
  const completedAll = allSlokas.filter((s) => s.completed).length;
  const bookShortName = activeBook?.shortName || "Bhagavad Gita";

  const chapterTitle = useMemo(() => {
    if (chapterFilter === "all") return "All chapters";
    const ch = chapters.find((c) => c.number === chapterFilter);
    return ch
      ? `Chapter ${ch.number} · ${ch.title}`
      : `Chapter ${chapterFilter}`;
  }, [chapterFilter, chapters]);

  // Keep global queue in sync with filtered list (survives tab/route changes)
  const queueSignature = useMemo(
    () =>
      filtered
        .filter((s) => s.audioUrl)
        .map((s) => `${s.id}:${s.audioUrl}`)
        .join("|"),
    [filtered]
  );

  useEffect(() => {
    if (loading) return;
    const tracks = filtered
      .map((s) => toTrack(s, bookShortName))
      .filter((t): t is ShlokaTrack => Boolean(t));
    if (tracks.length === 0) return;

    // Prefer keeping the already-playing track when returning to this page
    let start = 0;
    if (sessionActive && audioTrack) {
      const playingIdx = tracks.findIndex((t) => t.id === audioTrack.id);
      if (playingIdx >= 0) {
        setQueue(tracks, playingIdx);
        return;
      }
    }

    if (current) {
      const exact = tracks.findIndex((t) => t.id === current.id);
      if (exact >= 0) start = exact;
      else {
        const after = filtered.findIndex((s, i) => i >= index && s.audioUrl);
        if (after >= 0) {
          const id = filtered[after].id;
          const ti = tracks.findIndex((t) => t.id === id);
          if (ti >= 0) start = ti;
        }
      }
    }
    setQueue(tracks, start);
    // queueSignature captures filtered audio membership; index/current for start
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed by signature
  }, [
    loading,
    queueSignature,
    index,
    current?.id,
    bookShortName,
    setQueue,
    sessionActive,
    audioTrack?.id,
  ]);

  // When mini-player / Media Session changes track, keep page index in sync
  useEffect(() => {
    if (!audioTrack) return;
    const i = filtered.findIndex((s) => s.id === audioTrack.id);
    if (i >= 0 && i !== index) setIndex(i);
  }, [audioTrack?.id, filtered, index]);

  const goTo = useCallback(
    (nextIndex: number, autoPlay = false) => {
      if (total === 0) return;
      const safe = Math.max(0, Math.min(total - 1, nextIndex));
      setIndex(safe);
      const row = filtered[safe];
      if (!row) return;
      const tracks = filtered
        .map((s) => toTrack(s, bookShortName))
        .filter((t): t is ShlokaTrack => Boolean(t));
      const ti = tracks.findIndex((t) => t.id === row.id);
      if (ti >= 0) selectIndex(ti, autoPlay);
    },
    [total, filtered, bookShortName, selectIndex]
  );

  const goPrev = useCallback(() => {
    if (playing || audioTrack) {
      audioPrev();
      return;
    }
    goTo(index - 1);
  }, [playing, audioTrack, audioPrev, goTo, index]);

  const goNext = useCallback(() => {
    if (playing || audioTrack) {
      audioNext();
      return;
    }
    goTo(index + 1);
  }, [playing, audioTrack, audioNext, goTo, index]);

  const handleTogglePlay = useCallback(async () => {
    if (!current?.audioUrl) return;
    // Ensure queue points at current verse before play
    const tracks = filtered
      .map((s) => toTrack(s, bookShortName))
      .filter((t): t is ShlokaTrack => Boolean(t));
    const ti = tracks.findIndex((t) => t.id === current.id);
    if (ti >= 0 && audioTrack?.id !== current.id) {
      selectIndex(ti, true);
      return;
    }
    await togglePlay();
  }, [
    current,
    filtered,
    bookShortName,
    audioTrack?.id,
    selectIndex,
    togglePlay,
  ]);

  const markComplete = useCallback(() => {
    if (!current) return;
    setAllSlokas((prev) => {
      const next = prev.map((s) =>
        s.id === current.id ? { ...s, completed: !s.completed } : s
      );
      saveCompletedIds(new Set(next.filter((s) => s.completed).map((s) => s.id)));
      return next;
    });
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        void handleTogglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, handleTogglePlay]);

  const selectBook = (id: string) => {
    setBookId(id);
    const book = books.find((b) => b.id === id);
    const firstChapter = book?.chapters[0]?.number;
    // Keep "all" if user was on all; otherwise land on first chapter of book
    if (chapterFilter !== "all" && firstChapter != null) {
      setChapterFilter(firstChapter);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-krishna" />
        <p className="text-sm text-[var(--text-muted)]">
          Loading Bhagavad Gita shlokas…
        </p>
      </div>
    );
  }

  if (allSlokas.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <GlassCard padding="p-6" strong className="text-center">
          <p className="text-4xl" aria-hidden>
            📜
          </p>
          <h1 className="mt-3 font-serif text-xl font-bold text-krishna">
            No shlokas found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Upload{" "}
            <code className="rounded bg-cream px-1">bg_slokas.json</code> to the
            public <strong>shlokas</strong> bucket, or run{" "}
            <code className="rounded bg-cream px-1">npm run storage:seed</code>.
          </p>
        </GlassCard>
      </div>
    );
  }

  const hasAudio = Boolean(current?.audioUrl);
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col">
      {/* Page header */}
      <header className="mb-4 shrink-0 sm:mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-peacock">
              Sacred verses
            </p>
            <h1 className="font-serif text-2xl font-bold text-krishna sm:text-3xl">
              Shloka Learning
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              One verse at a time — listen, learn, mark complete.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition",
              filtersOpen
                ? "border-krishna bg-krishna/10 text-krishna"
                : "border-gold/40 bg-white text-[var(--text-muted)] hover:bg-cream"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <GlassCard padding="p-3" lift={false} className="sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Book
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 font-serif text-sm font-bold text-krishna">
              <Library className="h-4 w-4 shrink-0 text-peacock" />
              {activeBook?.shortName || "Bhagavad Gita"}
            </p>
          </GlassCard>
          <GlassCard padding="p-3" lift={false}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              In this filter
            </p>
            <p className="mt-0.5 font-serif text-sm font-bold text-krishna">
              {completedInFilter}/{total || 0} done
            </p>
            <ProgressBar
              value={total ? (completedInFilter / total) * 100 : 0}
              showLabel={false}
              height="h-1.5"
              className="mt-1.5"
            />
          </GlassCard>
          <GlassCard padding="p-3" lift={false}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              All verses
            </p>
            <p className="mt-0.5 font-serif text-sm font-bold text-peacock">
              {completedAll}/{allSlokas.length} ·{" "}
              {source === "storage" ? "Cloud" : "Local"}
            </p>
          </GlassCard>
        </div>
      </header>

      {/* Filters panel */}
      {filtersOpen && (
        <GlassCard
          padding="p-3.5 sm:p-4"
          lift={false}
          className="mb-4 shrink-0 border-krishna/20"
        >
          {/* Book */}
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-peacock">
              <BookOpen className="h-3.5 w-3.5" />
              Book
            </p>
            <div className="flex flex-wrap gap-2">
              {(books.length > 0
                ? books
                : [
                    {
                      id: DEFAULT_BOOK_ID,
                      shortName: "Bhagavad Gita",
                      name: "Bhagavad Gita As It Is",
                      chapters: [],
                    },
                  ]
              ).map((b) => {
                const active = bookId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBook(b.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      active
                        ? "border-krishna bg-krishna text-white shadow-sm"
                        : "border-gold/40 bg-white text-krishna hover:bg-cream"
                    )}
                  >
                    {b.shortName || b.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
              Default:{" "}
              <strong className="text-krishna">Bhagavad Gita</strong>
              {activeBook?.name ? ` · ${activeBook.name}` : ""}
            </p>
          </div>

          {/* Chapter */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-peacock">
              Chapter
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={chapterFilter === "all"}
                onClick={() => setChapterFilter("all")}
                label="All"
                count={allSlokas.length}
              />
              {chapters.map((ch) => {
                const count =
                  ch.shlokas?.length ||
                  allSlokas.filter((s) => s.chapter === ch.number).length;
                const done = allSlokas.filter(
                  (s) => s.chapter === ch.number && s.completed
                ).length;
                return (
                  <FilterChip
                    key={ch.number}
                    active={chapterFilter === ch.number}
                    onClick={() => setChapterFilter(ch.number)}
                    label={`Ch. ${ch.number}`}
                    count={count}
                    done={done}
                    title={ch.title}
                  />
                );
              })}
            </div>
            {/* Chapter + Shloka number dropdowns */}
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  Chapter
                </span>
                <select
                  value={chapterFilter === "all" ? "all" : String(chapterFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setChapterFilter(v === "all" ? "all" : Number(v));
                  }}
                  className="h-11 w-full rounded-xl border border-gold/45 bg-white px-3 text-sm font-medium text-krishna outline-none focus:border-krishna focus:ring-2 focus:ring-krishna/20"
                >
                  <option value="all">
                    All chapters ({allSlokas.length} verses)
                  </option>
                  {chapters.map((ch) => {
                    const count =
                      ch.shlokas?.length ||
                      allSlokas.filter((s) => s.chapter === ch.number).length;
                    return (
                      <option key={ch.number} value={ch.number}>
                        Chapter {ch.number} — {ch.title} ({count})
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  Shloka number
                </span>
                <select
                  value={
                    chapterFilter !== "all" && current
                      ? current.id
                      : ""
                  }
                  disabled={chapterFilter === "all" || filtered.length === 0}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const i = filtered.findIndex((s) => s.id === id);
                    if (i >= 0) goTo(i);
                  }}
                  className="h-11 w-full rounded-xl border border-gold/45 bg-white px-3 text-sm font-medium text-krishna outline-none focus:border-krishna focus:ring-2 focus:ring-krishna/20 disabled:cursor-not-allowed disabled:bg-cream/60 disabled:text-[var(--text-muted)]"
                >
                  {chapterFilter === "all" ? (
                    <option value="">
                      Select a chapter first
                    </option>
                  ) : filtered.length === 0 ? (
                    <option value="">No shlokas in this chapter</option>
                  ) : (
                    filtered.map((s) => (
                      <option key={s.id} value={s.id}>
                        Shloka {s.verseNumber}
                        {s.completed ? " ✓" : ""} — {s.label}
                        {s.transliteration
                          ? ` · ${s.transliteration.slice(0, 36)}${s.transliteration.length > 36 ? "…" : ""}`
                          : ""}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Showing:{" "}
              <span className="font-semibold text-krishna">{chapterTitle}</span>
              {total > 0 ? ` · ${total} verse${total === 1 ? "" : "s"}` : ""}
              {chapterFilter !== "all" && current
                ? ` · now on Shloka ${current.verseNumber}`
                : ""}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Empty filter */}
      {!current || total === 0 ? (
        <GlassCard padding="p-6" className="text-center" lift={false}>
          <p className="text-sm text-[var(--text-muted)]">
            No verses in this chapter filter. Choose another chapter or{" "}
            <button
              type="button"
              className="font-semibold text-krishna underline"
              onClick={() => setChapterFilter("all")}
            >
              show all
            </button>
            .
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Centered verse */}
          <div className="flex flex-1 flex-col justify-center">
            <GlassCard
              strong
              gold
              lift={false}
              className="relative mx-auto w-full text-center"
              padding="p-5 sm:p-8 md:p-10"
            >
              {current.completed && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-tulasi/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800 sm:right-4 sm:top-4">
                  <CheckCircle2 className="h-3 w-3" />
                  Done
                </span>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-krishna/10 px-3 py-1 text-xs font-semibold text-krishna">
                  <BookOpen className="h-3.5 w-3.5" />
                  {activeBook?.shortName || "Bhagavad Gita"}
                </span>
                <span className="rounded-full bg-peacock/10 px-3 py-1 text-xs font-semibold text-peacock">
                  {current.label}
                </span>
              </div>

              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Chapter {current.chapter}
                {chapters.find((c) => c.number === current.chapter)?.title
                  ? ` · ${chapters.find((c) => c.number === current.chapter)?.title}`
                  : ""}
              </p>

              {current.sanskrit ? (
                <p className="mt-5 whitespace-pre-line font-sanskrit text-xl leading-loose text-krishna sm:mt-6 sm:text-2xl md:text-3xl">
                  {current.sanskrit}
                </p>
              ) : null}

              {current.transliteration ? (
                <p className="mt-4 whitespace-pre-line font-serif text-sm italic leading-relaxed text-[var(--text-primary)] sm:text-base md:text-lg">
                  {current.transliteration}
                </p>
              ) : null}

              {current.translation ? (
                <div className="mx-auto mt-5 max-w-xl border-t border-gold/35 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-peacock">
                    Translation
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-primary)] sm:text-base">
                    {current.translation}
                  </p>
                </div>
              ) : null}

              {current.meaning ? (
                <div className="mx-auto mt-4 max-w-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-peacock">
                    Meaning
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {current.meaning}
                  </p>
                </div>
              ) : null}

              {hasAudio ? (
                <div className="mx-auto mt-6 max-w-md">
                  <div className="h-1.5 overflow-hidden rounded-full border border-gold/25 bg-cream">
                    <div
                      className="h-full rounded-full bg-krishna transition-[width] duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--text-muted)]">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  {audioError && (
                    <p className="mt-1 text-xs text-rose-600">
                      Could not play audio. Check the network or file URL.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-xs text-[var(--text-muted)]">
                  No audio file for this verse.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <ControlButton
                  label="Mute"
                  active={muted}
                  onClick={() => setMuted((m) => !m)}
                  disabled={!hasAudio}
                >
                  {muted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </ControlButton>

                <ControlButton
                  label={playing ? "Pause" : "Play"}
                  primary
                  onClick={() => void handleTogglePlay()}
                  disabled={!hasAudio}
                >
                  {playing ? (
                    <Pause className="h-6 w-6" fill="currentColor" />
                  ) : (
                    <Play className="h-6 w-6" fill="currentColor" />
                  )}
                </ControlButton>

                <ControlButton
                  label="Loop"
                  active={loop}
                  onClick={() => setLoop((l) => !l)}
                  disabled={!hasAudio}
                >
                  <Repeat className="h-5 w-5" />
                </ControlButton>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className={cn(muted && "font-semibold text-krishna")}>
                  {muted ? "Muted" : "Sound on"}
                </span>
                <span aria-hidden>·</span>
                <span className={cn(loop && "font-semibold text-peacock")}>
                  {loop ? "Loop on" : "Loop off"}
                </span>
                <span aria-hidden>·</span>
                <span className={cn(playing && "font-semibold text-tulasi")}>
                  {playing ? "Playing" : "Paused"}
                </span>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  variant={current.completed ? "secondary" : "gold"}
                  size="lg"
                  className="w-full max-w-sm"
                  onClick={markComplete}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {current.completed
                    ? "Completed · Tap to undo"
                    : "Mark as Complete"}
                </Button>
              </div>
            </GlassCard>
          </div>

          {/* Prev / Next within filter */}
          <div className="mt-5 flex shrink-0 items-center justify-between gap-3 pb-2 sm:mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={goPrev}
              disabled={index <= 0}
              className="min-w-[7.5rem] sm:min-w-[9rem]"
            >
              <ChevronLeft className="h-5 w-5" />
              Prev
            </Button>

            <div className="text-center">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                {chapterFilter === "all"
                  ? "All chapters"
                  : `Chapter ${chapterFilter}`}
              </p>
              <p className="font-serif text-sm font-bold text-krishna">
                {index + 1} / {total}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={goNext}
              disabled={index >= total - 1}
              className="min-w-[7.5rem] sm:min-w-[9rem]"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="mt-1 pb-4 text-center text-[10px] text-[var(--text-muted)] sm:text-xs">
            Keyboard: ← prev · → next · Space play/pause · continues in
            background
          </p>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  done,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  done?: number;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
        active
          ? "border-peacock bg-peacock text-white shadow-sm"
          : "border-gold/40 bg-white text-krishna hover:bg-cream"
      )}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-1 tabular-nums",
            active ? "text-white/85" : "text-[var(--text-muted)]"
          )}
        >
          ({typeof done === "number" ? `${done}/` : ""}
          {count})
        </span>
      )}
    </button>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
  primary,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full border-2 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "h-14 w-14 border-krishna bg-krishna text-white shadow-lg shadow-krishna/30 hover:bg-[#16408a] sm:h-16 sm:w-16"
          : "h-12 w-12 border-gold/50 bg-white text-krishna hover:bg-cream sm:h-14 sm:w-14",
        active && !primary && "border-peacock bg-peacock/10 text-peacock"
      )}
    >
      {children}
    </button>
  );
}
