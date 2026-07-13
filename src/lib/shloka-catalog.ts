/**
 * Shloka catalog — loaded from Supabase Storage (shlokas/bg_slokas.json),
 * with a local JSON fallback when storage is unavailable.
 */
import localRawSlokas from "@/components/assets/bg_slokas.json";
import {
  getShlokasJsonPublicUrl,
  resolveShlokaAudioUrl,
} from "@/lib/supabase";

export type BgSlokaRaw = {
  id: string;
  chapter: number;
  verseNumber: number;
  sanskrit: string;
  english: string;
  translation: string;
  audioUrl?: string;
  meaning?: string;
};

export type CatalogShloka = {
  id: string;
  verse: string;
  label: string;
  sanskrit: string;
  transliteration: string;
  translation: string;
  meaning?: string;
  audioUrl?: string;
  chapter: number;
  verseNumber: number;
};

export type CatalogChapter = {
  number: number;
  title: string;
  shlokas: CatalogShloka[];
};

export type CatalogBook = {
  id: string;
  name: string;
  shortName: string;
  chapters: CatalogChapter[];
};

/** Optional friendly titles for BG chapters that appear in the JSON */
const CHAPTER_TITLES: Record<number, string> = {
  1: "Observing the Armies on the Battlefield of Kurukṣetra",
  2: "Contents of the Gītā Summarized",
  3: "Karma-yoga",
  4: "Transcendental Knowledge",
  5: "Karma-yoga – Action in Kṛṣṇa Consciousness",
  6: "Dhyāna-yoga",
  7: "Knowledge of the Absolute",
  8: "Attaining the Supreme",
  9: "The Most Confidential Knowledge",
  10: "The Opulence of the Absolute",
  11: "The Universal Form",
  12: "Devotional Service",
  13: "Nature, the Enjoyer and Consciousness",
  14: "The Three Modes of Material Nature",
  15: "The Yoga of the Supreme Person",
  16: "The Divine and Demoniac Natures",
  17: "The Divisions of Faith",
  18: "Conclusion – The Perfection of Renunciation",
};

export function normalizeSlokas(raw: BgSlokaRaw[]): CatalogShloka[] {
  return raw
    .filter(
      (s) =>
        s != null &&
        s.chapter != null &&
        s.verseNumber != null &&
        !Number.isNaN(Number(s.chapter)) &&
        !Number.isNaN(Number(s.verseNumber))
    )
    .map((s) => {
      const chapter = Number(s.chapter);
      const verseNumber = Number(s.verseNumber);
      const id =
        s.id && String(s.id).trim()
          ? String(s.id).trim()
          : `bg-${chapter}-${verseNumber}`;
      return {
        id,
        chapter,
        verseNumber,
        verse: `${chapter}.${verseNumber}`,
        label: `BG ${chapter}.${verseNumber}`,
        sanskrit: (s.sanskrit || "").trim(),
        transliteration: (s.english || "").trim(),
        translation: (s.translation || "").trim(),
        meaning: (s.meaning || "").trim() || undefined,
        // Always resolve to Supabase Storage public URL (shlokas bucket)
        audioUrl: resolveShlokaAudioUrl(chapter, verseNumber, s.audioUrl),
      };
    })
    .sort((a, b) =>
      a.chapter !== b.chapter
        ? a.chapter - b.chapter
        : a.verseNumber - b.verseNumber
    );
}

export function buildChaptersFromSlokas(
  slokas: CatalogShloka[]
): CatalogChapter[] {
  const map = new Map<number, CatalogShloka[]>();
  for (const s of slokas) {
    const list = map.get(s.chapter) ?? [];
    list.push(s);
    map.set(s.chapter, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, chapterShlokas]) => ({
      number,
      title: CHAPTER_TITLES[number] ?? `Chapter ${number}`,
      shlokas: chapterShlokas,
    }));
}

export function buildBooksFromSlokas(slokas: CatalogShloka[]): CatalogBook[] {
  return [
    {
      id: "bg",
      name: "Bhagavad Gita As It Is",
      shortName: "Bhagavad Gita",
      chapters: buildChaptersFromSlokas(slokas),
    },
  ];
}

export function getBookFromList(books: CatalogBook[], bookId: string) {
  return books.find((b) => b.id === bookId) ?? books[0];
}

export function getChapterFromBook(
  book: CatalogBook,
  chapterNumber: number
): CatalogChapter {
  return (
    book.chapters.find((c) => c.number === chapterNumber) ??
    book.chapters[0] ?? {
      number: chapterNumber,
      title: CHAPTER_TITLES[chapterNumber] ?? `Chapter ${chapterNumber}`,
      shlokas: [],
    }
  );
}

/** Local fallback catalog (bundled JSON). */
export const LOCAL_BG_SLOKAS: CatalogShloka[] = normalizeSlokas(
  localRawSlokas as BgSlokaRaw[]
);

export const LOCAL_SHLOKA_BOOKS: CatalogBook[] =
  buildBooksFromSlokas(LOCAL_BG_SLOKAS);

/** @deprecated Prefer loadShlokaCatalog() — kept for any static imports */
export const BG_SLOKAS = LOCAL_BG_SLOKAS;
export const SHLOKA_BOOKS = LOCAL_SHLOKA_BOOKS;

export function getBook(bookId: string) {
  return getBookFromList(SHLOKA_BOOKS, bookId);
}

export function getChapter(bookId: string, chapterNumber: number) {
  return getChapterFromBook(getBook(bookId), chapterNumber);
}

export function getShlokasForChapter(chapterNumber: number): CatalogShloka[] {
  return BG_SLOKAS.filter((s) => s.chapter === chapterNumber);
}

export type ShlokaCatalogResult = {
  books: CatalogBook[];
  slokas: CatalogShloka[];
  source: "storage" | "local";
  count: number;
};

/**
 * Fetch shloka catalog from Supabase Storage.
 * Falls back to the bundled local JSON if storage is unreachable.
 */
export async function loadShlokaCatalog(
  options?: { forceLocal?: boolean; signal?: AbortSignal }
): Promise<ShlokaCatalogResult> {
  if (!options?.forceLocal) {
    try {
      const url = getShlokasJsonPublicUrl();
      if (url) {
        const res = await fetch(url, {
          signal: options?.signal,
          // Always try fresh content from storage; CDN may still cache.
          cache: "no-store",
        });
        if (res.ok) {
          const raw = (await res.json()) as BgSlokaRaw[];
          if (Array.isArray(raw) && raw.length > 0) {
            const slokas = normalizeSlokas(raw);
            return {
              books: buildBooksFromSlokas(slokas),
              slokas,
              source: "storage",
              count: slokas.length,
            };
          }
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  return {
    books: LOCAL_SHLOKA_BOOKS,
    slokas: LOCAL_BG_SLOKAS,
    source: "local",
    count: LOCAL_BG_SLOKAS.length,
  };
}
