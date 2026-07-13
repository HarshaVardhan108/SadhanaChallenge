/**
 * Rewrite audioUrl in bg_slokas.json to:
 *   {SUPABASE_URL}/storage/v1/object/public/BhaktiChallenge/shlokas/bg_{ch}_{verse}.mp3
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "src/components/assets/bg_slokas.json");

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

const project =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qsabhsqvkdbfjpwfvfno.supabase.co";
const bucket = process.env.NEXT_PUBLIC_SHLOKAS_BUCKET || "BhaktiChallenge";
const folder = (process.env.NEXT_PUBLIC_SHLOKAS_FOLDER || "shlokas")
  .trim()
  .replace(/^\/+|\/+$/g, "");
const base = `${project}/storage/v1/object/public/${bucket}/${folder}`;

const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const next = rows.map((s) => {
  const ch = Number(s.chapter);
  const v = Number(s.verseNumber);
  let file = (s.audioUrl || "").split("?")[0].split("/").pop() || "";
  if (!file) file = `bg_${ch}_${v}.mp3`;
  if (!/\.(mp3|wav|m4a|ogg)$/i.test(file)) file = `${file}.mp3`;
  return { ...s, audioUrl: `${base}/${file}` };
});

fs.writeFileSync(jsonPath, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log(`Updated ${next.length} audioUrl rows`);
console.log(`Base: ${base}/bg_{ch}_{verse}.mp3`);
for (const s of next.slice(0, 5)) {
  console.log(`  ${s.id}: ${s.audioUrl}`);
}
