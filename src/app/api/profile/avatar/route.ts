import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  cookieOptions,
  createSessionToken,
  getSession,
} from "@/lib/auth";
import { api, getConvexClient } from "@/lib/convex";
import {
  MEDIA_BUCKET,
  PROFILES_FOLDER,
  createSupabaseClient,
  profileAvatarPath,
  publicObjectUrl,
} from "@/lib/supabase";
import type { Id } from "../../../../../convex/_generated/dataModel";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/profile/avatar
 * Multipart form field: `file`
 * Uploads to BhaktiChallenge/profiles/{userId}/avatar.{ext}
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const path = profileAvatarPath(session.id, ext);
    const userFolder = `${PROFILES_FOLDER}/${session.id}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = createSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured on the server." },
        { status: 503 }
      );
    }

    // Remove previous variants in this user's profiles subfolder
    const { data: existing } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(userFolder, { limit: 20 });
    if (existing?.length) {
      await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(existing.map((f) => `${userFolder}/${f.name}`));
    }

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("avatar upload", uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message ||
            `Upload failed. Allow INSERT on bucket "${MEDIA_BUCKET}" folder "${PROFILES_FOLDER}/".`,
        },
        { status: 502 }
      );
    }

    const avatarUrl = `${publicObjectUrl(MEDIA_BUCKET, path)}?t=${Date.now()}`;

    try {
      const convex = getConvexClient();
      await convex.mutation(api.users.setAvatarUrl, {
        id: session.id as Id<"users">,
        avatarUrl,
      });
    } catch (dbErr) {
      console.warn("avatar URL Convex update failed — URL still returned", dbErr);
    }

    const nextUser = { ...session, avatarUrl };
    const token = await createSessionToken(nextUser);
    const opts = await cookieOptions();
    const res = NextResponse.json({ ok: true, avatarUrl, user: nextUser });
    res.cookies.set(AUTH_COOKIE, token, opts);
    return res;
  } catch (e) {
    console.error("avatar route error", e);
    return NextResponse.json(
      { error: "Avatar upload failed." },
      { status: 500 }
    );
  }
}
