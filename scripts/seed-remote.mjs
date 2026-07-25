/**
 * Create tables + demo users on a remote Postgres (Neon / any hosted PG).
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
 *   node scripts/seed-remote.mjs
 *
 * Or:
 *   node scripts/seed-remote.mjs "postgresql://..."
 */
import pg from "pg";

const connectionString =
  process.argv[2] ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error(`
Missing DATABASE_URL.

1. Create a free DB at https://console.neon.tech
2. Copy the connection string (pooled is fine)
3. Run:

   $env:DATABASE_URL="postgresql://USER:PASS@ep-xxx.neon.tech/neondb?sslmode=require"
   node scripts/seed-remote.mjs
`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30_000,
});

const DEMO_PASSWORD = "admin123";

async function main() {
  console.log("Connecting to remote Postgres…");
  await client.connect();
  const info = await client.query(
    `SELECT current_database() AS db, current_user AS usr, version() AS v`
  );
  console.log("Connected:", {
    database: info.rows[0].db,
    user: info.rows[0].usr,
    version: String(info.rows[0].v).slice(0, 60),
  });

  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  } catch {
    console.log("pgcrypto optional — continuing");
  }

  // ── users ──────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name     TEXT NOT NULL DEFAULT '',
      email         TEXT UNIQUE,
      phone         TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      temple        TEXT DEFAULT '',
      city          TEXT DEFAULT '',
      country       TEXT DEFAULT 'India',
      avatar_url    TEXT,
      invite_code   TEXT UNIQUE,
      invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
    );
  `);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code TEXT`);
  await client.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id UUID`
  );

  // Demo + real local accounts (plain password for easy login)
  for (const u of [
    {
      name: "Harsha",
      email: "harsha@example.com",
      phone: "9705822395",
      temple: "ISKCON Tirupati",
      city: "Tirupati",
    },
    {
      name: "Demo Devotee",
      email: "devotee@example.com",
      phone: "9876543210",
      temple: "ISKCON Bangalore",
      city: "Bangalore",
    },
    {
      name: "Daruri Harsha Vardhan Naidu",
      email: "umapathi2harsha@gmail.com",
      phone: "8885254742",
      temple: "",
      city: "",
    },
  ]) {
    await client.query(
      `
      INSERT INTO users (full_name, email, phone, password_hash, temple, city, country)
      VALUES ($1, $2, $3, $4, $5, $6, 'India')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        temple = EXCLUDED.temple,
        city = EXCLUDED.city,
        updated_at = NOW()
      `,
      [u.name, u.email, u.phone, DEMO_PASSWORD, u.temple, u.city]
    );
  }

  // ── challenges ─────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id                TEXT PRIMARY KEY,
      type              TEXT NOT NULL DEFAULT 'custom'
                        CHECK (type IN ('custom', 'shloka')),
      name              TEXT NOT NULL,
      days              INT  NOT NULL CHECK (days >= 1),
      visibility        TEXT NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public', 'private')),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by_name   TEXT NOT NULL DEFAULT '',
      created_by_avatar TEXT,
      invite_code       TEXT UNIQUE,
      team_name         TEXT,
      team_goal         TEXT,
      shloka_ids        JSONB DEFAULT '[]'::jsonb,
      daily_tasks       JSONB DEFAULT '[]'::jsonb
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS challenge_participants (
      challenge_id   TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name      TEXT NOT NULL DEFAULT '',
      user_avatar    TEXT,
      joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      progress_days  JSONB NOT NULL DEFAULT '{}'::jsonb,
      PRIMARY KEY (challenge_id, user_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      current_streak INT NOT NULL DEFAULT 0,
      longest_streak INT NOT NULL DEFAULT 0,
      last_active    DATE,
      history        JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_shloka_completions (
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shloka_id  TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, shloka_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id           BIGSERIAL PRIMARY KEY,
      user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
      endpoint     TEXT NOT NULL UNIQUE,
      p256dh       TEXT NOT NULL,
      auth         TEXT NOT NULL,
      enabled      BOOLEAN NOT NULL DEFAULT TRUE,
      timezone     TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      hour         INT NOT NULL DEFAULT 21,
      last_sent_date DATE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const users = await client.query(
    `SELECT id, full_name, email, phone FROM users ORDER BY email`
  );
  console.log("\nUsers ready:");
  console.table(users.rows);
  console.log("\nLogin password for all seeded users: admin123");
  console.log("Remote database is ready for Vercel.");

  await client.end();
}

main().catch(async (e) => {
  console.error("\nSeed failed:", e.message || e);
  try {
    await client.end();
  } catch {
    /* */
  }
  process.exit(1);
});
