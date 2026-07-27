/**
 * One-shot check: can service-role key upload to profiles/ ?
 *   node scripts/test-avatar-upload.mjs
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
const secret =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const bucket = process.env.NEXT_PUBLIC_SHLOKAS_BUCKET || "BhaktiChallenge";
const testPath = "profiles/_upload_test/avatar.jpg";

// Minimal valid JPEG
const tinyJpeg = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
  "base64"
);

async function tryUpload(label, key) {
  if (!key) {
    console.log(`${label}: no key`);
    return;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buckets, error: be } = await sb.storage.listBuckets();
  console.log(
    `${label} listBuckets:`,
    be
      ? be.message
      : (buckets || [])
          .map((b) => `${b.name}(public=${b.public})`)
          .join(", ") || "(none)"
  );
  const { error: up } = await sb.storage.from(bucket).upload(testPath, tinyJpeg, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (up) {
    console.log(`${label} upload FAIL:`, up.message);
  } else {
    console.log(`${label} upload OK → ${bucket}/${testPath}`);
    await sb.storage.from(bucket).remove([testPath]);
    console.log(`${label} cleaned up test object`);
  }
}

console.log("URL:", url);
console.log("Bucket:", bucket);
console.log(
  "Secret key:",
  secret
    ? secret.startsWith("eyJ")
      ? "JWT service_role present"
      : secret.startsWith("sb_secret")
        ? "sb_secret present"
        : "present (other format)"
    : "MISSING"
);
console.log("");
await tryUpload("ADMIN", secret);
await tryUpload("ANON", publishable);
