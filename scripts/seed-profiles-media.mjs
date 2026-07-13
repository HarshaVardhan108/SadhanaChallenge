/**
 * Upload intro media into BhaktiChallenge/profiles/
 *
 *   profiles/introvideo.mp4
 *   profiles/intro-vrindavan-bg.jpg
 *   profiles/intro-vrindavan-mobile.jpg
 *
 * Requires write policy or SUPABASE_SECRET_KEY.
 *
 *   node scripts/seed-profiles-media.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const bucket = process.env.NEXT_PUBLIC_SHLOKAS_BUCKET || "BhaktiChallenge";
const folder = process.env.NEXT_PUBLIC_PROFILES_FOLDER || "profiles";

const files = [
  {
    local: path.join(root, "public/introvideo.mp4"),
    remote: `${folder}/introvideo.mp4`,
    type: "video/mp4",
  },
  {
    local: path.join(root, "public/intro-vrindavan-bg.jpg"),
    remote: `${folder}/intro-vrindavan-bg.jpg`,
    type: "image/jpeg",
  },
  {
    local: path.join(root, "public/intro-vrindavan-mobile.jpg"),
    remote: `${folder}/intro-vrindavan-mobile.jpg`,
    type: "image/jpeg",
  },
];

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("Bucket:", bucket);
console.log("Folder:", folder);

for (const f of files) {
  if (!fs.existsSync(f.local)) {
    console.log("skip (missing local):", f.local);
    continue;
  }
  const body = fs.readFileSync(f.local);
  const { error } = await sb.storage.from(bucket).upload(f.remote, body, {
    contentType: f.type,
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    console.error("✗", f.remote, error.message);
  } else {
    const pub = `${url}/storage/v1/object/public/${bucket}/${f.remote}`;
    console.log("✓", f.remote);
    console.log(" ", pub);
  }
}
