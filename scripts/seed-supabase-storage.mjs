/**
 * Seed Supabase Storage catalog JSON:
 *   Bucket: BhaktiChallenge
 *   Path:   shlokas/bg_slokas.json
 *
 * Uses the publishable key by default. Uploads need write policies or a secret key:
 *   set SUPABASE_SECRET_KEY=sb_secret_... (or legacy service_role JWT)
 *
 * Usage:
 *   node scripts/seed-supabase-storage.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  publishable;

if (!url || !publishable) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  );
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SHLOKAS_BUCKET =
  process.env.NEXT_PUBLIC_SHLOKAS_BUCKET || "BhaktiChallenge";
const SHLOKAS_FOLDER = (
  process.env.NEXT_PUBLIC_SHLOKAS_FOLDER || "shlokas"
).replace(/^\/+|\/+$/g, "");
const JSON_PATH = `${SHLOKAS_FOLDER}/bg_slokas.json`;
const localJson = path.join(root, "src/components/assets/bg_slokas.json");

async function main() {
  console.log("Supabase URL:", url);
  console.log(`Bucket: ${SHLOKAS_BUCKET}`);
  console.log(`Path:   ${JSON_PATH}`);
  console.log("Seeding catalog JSON…\n");

  if (!fs.existsSync(localJson)) {
    console.error("Missing local file:", localJson);
    process.exit(1);
  }

  const body = fs.readFileSync(localJson);
  const { error: upErr } = await admin.storage
    .from(SHLOKAS_BUCKET)
    .upload(JSON_PATH, body, {
      contentType: "application/json",
      upsert: true,
      cacheControl: "3600",
    });

  if (upErr) {
    console.error("✗ upload bg_slokas.json:", upErr.message);
    console.error(
      `  In Dashboard → Storage → ${SHLOKAS_BUCKET} → Policies, allow INSERT,`
    );
    console.error("  or re-run with SUPABASE_SECRET_KEY set.");
    process.exit(1);
  }

  const publicUrl = `${url}/storage/v1/object/public/${SHLOKAS_BUCKET}/${JSON_PATH}`;
  console.log("✓ uploaded", JSON_PATH);
  console.log("  Public URL:", publicUrl);

  // Verify
  const res = await fetch(publicUrl);
  console.log(
    res.ok
      ? `✓ public read OK (${res.status})`
      : `✗ public read failed (${res.status}) — set bucket to Public`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
