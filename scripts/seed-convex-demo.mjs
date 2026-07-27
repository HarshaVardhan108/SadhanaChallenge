/**
 * Seed demo users into Convex (replaces Postgres setup-auth-db).
 *
 * Prerequisites:
 *   npx convex dev   # sets NEXT_PUBLIC_CONVEX_URL in .env.local
 *
 * Usage:
 *   node scripts/seed-convex-demo.mjs
 *
 * Demo login: harsha@example.com / admin123
 */
import { ConvexHttpClient } from "convex/browser";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
if (!url) {
  console.error(
    "Missing NEXT_PUBLIC_CONVEX_URL. Run `npx convex dev` first."
  );
  process.exit(1);
}

// Dynamic import of generated api after env is loaded
const { api } = await import("../convex/_generated/api.js");

const client = new ConvexHttpClient(url);

// Plain-text passwords are accepted by auth.verifyPassword for demo seeds
const DEMO_PASSWORD = "admin123";

const result = await client.mutation(api.users.seedDemoUsers, {
  users: [
    {
      fullName: "Harsha",
      email: "harsha@example.com",
      phone: "9705822395",
      passwordHash: DEMO_PASSWORD,
      temple: "ISKCON Bangalore",
      city: "Bangalore",
    },
    {
      fullName: "Demo Devotee",
      email: "devotee@example.com",
      phone: "9876543210",
      passwordHash: DEMO_PASSWORD,
      temple: "ISKCON Bangalore",
      city: "Bangalore",
    },
  ],
});

console.log("Seeded demo users:", result);
console.log("Login: harsha@example.com / admin123");
