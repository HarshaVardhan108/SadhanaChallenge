import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
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

loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listAll(bucket, prefix = "", depth = 0, acc = []) {
  if (depth > 4) return acc;
  const { data, error } = await sb.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) {
    console.log("list error", prefix || "(root)", error.message);
    return acc;
  }
  for (const item of data || []) {
    const full = prefix ? `${prefix}/${item.name}` : item.name;
    // folders often have null id / null metadata
    const isFolder = !item.id || item.metadata == null;
    if (isFolder && !/\.(mp3|json|wav|m4a|ogg)$/i.test(item.name)) {
      await listAll(bucket, full, depth + 1, acc);
    } else {
      acc.push({
        path: full,
        name: item.name,
        size: item.metadata?.size,
        type: item.metadata?.mimetype,
      });
    }
  }
  return acc;
}

const bucket = process.argv[2] || "shlokas";
console.log("Project:", url);
console.log("Bucket:", bucket);

const { data: buckets, error: be } = await sb.storage.listBuckets();
console.log(
  "Buckets:",
  be?.message || (buckets || []).map((b) => `${b.name}(public=${b.public})`).join(", ") || "(none listed)"
);

const files = await listAll(bucket);
console.log("Files found:", files.length);
for (const f of files.slice(0, 80)) {
  const pub = sb.storage.from(bucket).getPublicUrl(f.path).data.publicUrl;
  console.log("-", f.path, f.size ?? "", pub);
}

// Probe a few likely audio paths
const probes = [
  "bg_1_1.mp3",
  "audio/bg_1_1.mp3",
  "bg_shlokas/bg_1_1.mp3",
  "mp3/bg_1_1.mp3",
  "bg/bg_1_1.mp3",
  "1/bg_1_1.mp3",
  "bg_slokas.json",
];
console.log("\nHEAD probes:");
for (const p of probes) {
  const pub = sb.storage.from(bucket).getPublicUrl(p).data.publicUrl;
  try {
    const res = await fetch(pub, { method: "HEAD" });
    console.log(res.status, p);
  } catch (e) {
    console.log("ERR", p, e.message);
  }
}
