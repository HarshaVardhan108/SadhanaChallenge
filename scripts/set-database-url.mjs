/**
 * Append / update DATABASE_URL in .env.local (does not print the secret).
 *
 *   node scripts/set-database-url.mjs "postgresql://..."
 */
import fs from "fs";
import path from "path";

const url = process.argv[2];
if (!url || !url.startsWith("postgres")) {
  console.error('Usage: node scripts/set-database-url.mjs "postgresql://..."');
  process.exit(1);
}

const envPath = path.join(process.cwd(), ".env.local");
let text = "";
try {
  text = fs.readFileSync(envPath, "utf8");
} catch {
  text = "";
}

const line = `DATABASE_URL=${url}`;
if (/^DATABASE_URL=/m.test(text)) {
  text = text.replace(/^DATABASE_URL=.*$/m, line);
} else {
  text = text.trimEnd() + `\n\n# Hosted Postgres (Neon) — used by Vercel + local\n${line}\n`;
}

// Prefer remote over localhost when both exist
if (!/^DB_SSL=/m.test(text)) {
  text = text.trimEnd() + `\nDB_SSL=true\n`;
} else {
  text = text.replace(/^DB_SSL=.*$/m, "DB_SSL=true");
}

fs.writeFileSync(envPath, text, "utf8");
console.log("Updated .env.local with DATABASE_URL and DB_SSL=true");
console.log("Do NOT commit .env.local. Add the same DATABASE_URL in Vercel env vars.");
