import { NextResponse } from "next/server";
import { loadShlokaCatalog } from "@/lib/shloka-catalog";
import {
  SHLOKAS_BUCKET,
  SHLOKAS_FOLDER,
  createSupabaseClient,
  publicObjectUrl,
  resolveShlokaAudioUrl,
} from "@/lib/supabase";

/**
 * GET /api/shlokas
 * Returns the shloka catalog. Each row includes audioUrl pointing at:
 *   BhaktiChallenge/shlokas/bg_{chapter}_{verse}.mp3
 *
 * Optional query: ?probe=1 — HEAD-checks audio files and sets audioAvailable.
 */
export async function GET(req: Request) {
  try {
    const catalog = await loadShlokaCatalog();
    const { searchParams } = new URL(req.url);
    const probe = searchParams.get("probe") === "1";

    // Ensure every verse has a Supabase audioUrl (normalize already does this,
    // but re-apply so API responses are always consistent).
    let slokas = catalog.slokas.map((s) => ({
      ...s,
      audioUrl:
        s.audioUrl ||
        resolveShlokaAudioUrl(s.chapter, s.verseNumber),
    }));

    // If the folder lists successfully, prefer exact matching filenames found there
    try {
      const sb = createSupabaseClient();
      if (sb) {
        const { data: listed } = await sb.storage
          .from(SHLOKAS_BUCKET)
          .list(SHLOKAS_FOLDER, { limit: 1000 });
        const audioFiles = new Map<string, string>();
        for (const f of listed || []) {
          if (f.name && /\.(mp3|wav|m4a|ogg)$/i.test(f.name)) {
            audioFiles.set(f.name.toLowerCase(), f.name);
          }
        }
        if (audioFiles.size > 0) {
          slokas = slokas.map((s) => {
            const want = `bg_${s.chapter}_${s.verseNumber}.mp3`.toLowerCase();
            const found = audioFiles.get(want);
            if (found) {
              return {
                ...s,
                audioUrl: publicObjectUrl(
                  SHLOKAS_BUCKET,
                  `${SHLOKAS_FOLDER}/${found}`
                ),
              };
            }
            return s;
          });
        }
      }
    } catch {
      /* listing optional — convention URLs still work */
    }

    if (probe) {
      slokas = await Promise.all(
        slokas.map(async (s) => {
          if (!s.audioUrl) return { ...s, audioAvailable: false };
          try {
            const res = await fetch(s.audioUrl, { method: "HEAD" });
            return { ...s, audioAvailable: res.ok };
          } catch {
            return { ...s, audioAvailable: false };
          }
        })
      );
    }

    return NextResponse.json({
      ok: true,
      source: catalog.source,
      count: slokas.length,
      books: catalog.books.map((b) => ({
        ...b,
        chapters: b.chapters.map((ch) => ({
          ...ch,
          shlokas: ch.shlokas.map((s) => {
            const live = slokas.find((x) => x.id === s.id);
            return live ?? s;
          }),
        })),
      })),
      slokas,
      audioBase: publicObjectUrl(SHLOKAS_BUCKET, `${SHLOKAS_FOLDER}/`),
    });
  } catch (e) {
    console.error("shlokas api error", e);
    return NextResponse.json(
      { ok: false, error: "Failed to load shlokas." },
      { status: 500 }
    );
  }
}
