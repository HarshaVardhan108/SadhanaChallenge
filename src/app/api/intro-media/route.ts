import { NextResponse } from "next/server";
import {
  INTRO_LOCAL_FALLBACKS,
  getIntroMediaUrls,
} from "@/lib/supabase";

async function resolveUrl(
  storageUrl: string,
  fallback: string
): Promise<{ url: string; source: "storage" | "local" }> {
  if (!storageUrl) return { url: fallback, source: "local" };
  try {
    const res = await fetch(storageUrl, { method: "HEAD", cache: "no-store" });
    if (res.ok) return { url: storageUrl, source: "storage" };
  } catch {
    /* fall through */
  }
  return { url: fallback, source: "local" };
}

/**
 * GET /api/intro-media
 * Resolves intro video + Krishna images from BhaktiChallenge/profiles/
 * with local public/ fallbacks when Storage objects are missing.
 */
export async function GET() {
  try {
    const remote = getIntroMediaUrls();
    const [video, desktop, mobile] = await Promise.all([
      resolveUrl(remote.video, INTRO_LOCAL_FALLBACKS.video),
      resolveUrl(remote.desktop, INTRO_LOCAL_FALLBACKS.desktop),
      resolveUrl(remote.mobile, INTRO_LOCAL_FALLBACKS.mobile),
    ]);

    return NextResponse.json({
      ok: true,
      video: video.url,
      desktop: desktop.url,
      mobile: mobile.url,
      sources: {
        video: video.source,
        desktop: desktop.source,
        mobile: mobile.source,
      },
      storagePaths: {
        video: "profiles/introvideo.mp4",
        desktop: "profiles/intro-vrindavan-bg.jpg",
        mobile: "profiles/intro-vrindavan-mobile.jpg",
        avatars: "profiles/{userId}/avatar.jpg",
      },
    });
  } catch (e) {
    console.error("intro-media error", e);
    return NextResponse.json({
      ok: true,
      video: INTRO_LOCAL_FALLBACKS.video,
      desktop: INTRO_LOCAL_FALLBACKS.desktop,
      mobile: INTRO_LOCAL_FALLBACKS.mobile,
      sources: { video: "local", desktop: "local", mobile: "local" },
    });
  }
}
