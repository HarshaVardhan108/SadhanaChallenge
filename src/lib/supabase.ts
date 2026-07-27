import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage layout:
 *   Bucket:  BhaktiChallenge  (public)
 *   shlokas/   — bg_1_1.mp3, …
 *   profiles/  — intro media + user avatars
 *     introvideo.mp4
 *     intro-vrindavan-bg.jpg
 *     intro-vrindavan-mobile.jpg
 *     {userId}/avatar.jpg
 */
export const SHLOKAS_BUCKET =
  process.env.NEXT_PUBLIC_SHLOKAS_BUCKET || "BhaktiChallenge";

/** Same public bucket used for shlokas + profiles media. */
export const MEDIA_BUCKET = SHLOKAS_BUCKET;

/** Folder inside the bucket that holds audio (+ optional catalog JSON). */
export const SHLOKAS_FOLDER =
  process.env.NEXT_PUBLIC_SHLOKAS_FOLDER || "shlokas";

/**
 * Folder for intro assets and user profile photos.
 * Override with NEXT_PUBLIC_PROFILES_FOLDER if needed.
 */
export const PROFILES_FOLDER =
  process.env.NEXT_PUBLIC_PROFILES_FOLDER || "profiles";

/** @deprecated Prefer MEDIA_BUCKET + PROFILES_FOLDER — kept for older imports */
export const AVATARS_BUCKET = MEDIA_BUCKET;

/** Path of the catalog JSON inside the bucket. */
export const SHLOKAS_JSON_PATH = `${SHLOKAS_FOLDER}/bg_slokas.json`;

/** Canonical intro media paths under profiles/ */
export const INTRO_VIDEO_PATH = `${PROFILES_FOLDER}/introvideo.mp4`;
export const INTRO_IMAGE_DESKTOP_PATH = `${PROFILES_FOLDER}/intro-vrindavan-bg.jpg`;
export const INTRO_IMAGE_MOBILE_PATH = `${PROFILES_FOLDER}/intro-vrindavan-mobile.jpg`;

/** Local public/ fallbacks if Storage objects are missing. */
export const INTRO_LOCAL_FALLBACKS = {
  video: "/introvideo.mp4",
  desktop: "/intro-vrindavan-bg.jpg",
  mobile: "/intro-vrindavan-mobile.jpg",
} as const;

/**
 * Optional extra prefix under the shlokas folder.
 * Default audio path: shlokas/bg_2_47.mp3
 */
export function getShlokasAudioPrefix(): string {
  const folder = SHLOKAS_FOLDER.replace(/^\/+|\/+$/g, "");
  const extra = (process.env.NEXT_PUBLIC_SHLOKAS_AUDIO_PREFIX || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (folder && extra) return `${folder}/${extra}`;
  return folder || extra;
}

/** Browser / server client using the publishable (anon) key. */
export function createSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn(
      "Supabase env missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)"
    );
    return null;
  }
  return createClient(url, key);
}

/**
 * Server-only client with the secret / service-role key.
 * Bypasses Storage RLS — required for avatar uploads because this app
 * uses custom session auth, not Supabase Auth (auth.uid() is always null).
 *
 * Set SUPABASE_SECRET_KEY (new) or SUPABASE_SERVICE_ROLE_KEY (legacy JWT).
 * Never expose this key to the browser.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      "Supabase admin env missing (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)"
    );
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public object URL (works when the bucket is public). */
export function publicObjectUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}

export function getShlokasJsonPublicUrl(): string {
  return publicObjectUrl(SHLOKAS_BUCKET, SHLOKAS_JSON_PATH);
}

/** Public URL for an object inside the profiles/ folder. */
export function profilesObjectUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  const path = clean.startsWith(`${PROFILES_FOLDER}/`)
    ? clean
    : `${PROFILES_FOLDER}/${clean}`;
  return publicObjectUrl(MEDIA_BUCKET, path);
}

export function getIntroMediaUrls() {
  return {
    video: publicObjectUrl(MEDIA_BUCKET, INTRO_VIDEO_PATH),
    desktop: publicObjectUrl(MEDIA_BUCKET, INTRO_IMAGE_DESKTOP_PATH),
    mobile: publicObjectUrl(MEDIA_BUCKET, INTRO_IMAGE_MOBILE_PATH),
  };
}

/** Storage path for a user's avatar: profiles/{userId}/avatar.{ext} */
export function profileAvatarPath(userId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, "").toLowerCase() || "jpg";
  return `${PROFILES_FOLDER}/${userId}/avatar.${safeExt}`;
}

/**
 * Canonical audio object path for a verse:
 *   shlokas/bg_{chapter}_{verseNumber}.mp3
 */
export function shlokaAudioObjectPath(
  chapter: number,
  verseNumber: number,
  existingUrl?: string | null
): string {
  const prefix = getShlokasAudioPrefix();
  let filename = `bg_${chapter}_${verseNumber}.mp3`;

  if (existingUrl) {
    try {
      const last = existingUrl.split("?")[0].split("/").pop() || "";
      if (last) {
        // Ensure .mp3 (some catalog rows omit the extension)
        filename = /\.(mp3|wav|m4a|ogg)$/i.test(last) ? last : `${last}.mp3`;
      }
    } catch {
      /* keep default filename */
    }
  }

  return prefix ? `${prefix}/${filename}` : filename;
}

/** Public Supabase Storage URL for a shloka's audio file. */
export function resolveShlokaAudioUrl(
  chapter: number,
  verseNumber: number,
  existingUrl?: string | null
): string {
  // Already points at this project's public storage in the right bucket — keep
  const project = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (
    existingUrl &&
    project &&
    existingUrl.includes(project) &&
    existingUrl.includes(`/object/public/${SHLOKAS_BUCKET}/`)
  ) {
    return existingUrl.split("?")[0];
  }

  return publicObjectUrl(
    SHLOKAS_BUCKET,
    shlokaAudioObjectPath(chapter, verseNumber, existingUrl)
  );
}
