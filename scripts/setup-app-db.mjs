/**
 * Creates app tables for challenges, streaks, shloka progress, user settings.
 * Uses same DB credentials as auth setup.
 *
 *   npm run db:setup-app
 */
import pg from "pg";

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "admin123",
  database: process.env.DB_NAME || "SadhanaChallenge",
};

const client = new pg.Client(config);

async function main() {
  await client.connect();
  console.log("Connected to", config.database);

  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  } catch {
    console.log("pgcrypto optional");
  }

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
      goal              TEXT,
      activities        JSONB NOT NULL DEFAULT '[]'::jsonb,
      activity_labels   JSONB NOT NULL DEFAULT '[]'::jsonb,
      book_id           TEXT,
      book_name         TEXT,
      chapter_number    INT,
      shloka_ids        JSONB NOT NULL DEFAULT '[]'::jsonb,
      shlokas           JSONB NOT NULL DEFAULT '[]'::jsonb,
      invites           JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS challenge_participants (
      id              TEXT PRIMARY KEY,
      challenge_id    TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
      name            TEXT NOT NULL,
      accepted        BOOLEAN NOT NULL DEFAULT TRUE,
      completed_days  JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_participants_challenge
      ON challenge_participants (challenge_id);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_participants_user
      ON challenge_participants (user_id);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_challenges_visibility
      ON challenges (visibility);
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_streaks (
      user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      completed_dates  JSONB NOT NULL DEFAULT '[]'::jsonb,
      best_streak      INT NOT NULL DEFAULT 0,
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_shloka_completions (
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shloka_id    TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, shloka_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      spiritual_name  TEXT NOT NULL DEFAULT '',
      daily_rounds    INT NOT NULL DEFAULT 16,
      reading_minutes INT NOT NULL DEFAULT 20,
      flute_ambient   BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Web Push subscriptions (daily 9pm reminders)
  await client.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
      endpoint        TEXT NOT NULL UNIQUE,
      p256dh          TEXT NOT NULL,
      auth            TEXT NOT NULL,
      enabled         BOOLEAN NOT NULL DEFAULT TRUE,
      timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      hour            INT NOT NULL DEFAULT 21 CHECK (hour >= 0 AND hour <= 23),
      last_sent_date  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_push_enabled
      ON push_subscriptions (enabled) WHERE enabled = TRUE;
  `);

  // Seed a public demo challenge if none exists
  const demoId = "ch-demo-public-kartik-21";
  const exists = await client.query(
    `SELECT id FROM challenges WHERE id = $1`,
    [demoId]
  );
  if (exists.rows.length === 0) {
    const days = 21;
    const started = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const pattern = (upTo, extra = []) =>
      Array.from({ length: days }, (_, i) => i < upTo || extra.includes(i));

    await client.query(
      `INSERT INTO challenges (
        id, type, name, days, visibility, created_at, created_by_name,
        goal, activities, activity_labels, invites
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb)`,
      [
        demoId,
        "custom",
        "Kartik Month Sankalpa",
        days,
        "public",
        started.toISOString(),
        "Harsha",
        "Daily japa, reading & gratitude — walk together back home, back to Godhead.",
        JSON.stringify(["chanting", "reading", "gratitude"]),
        JSON.stringify(["Chanting (japa)", "Reading", "Gratitude journal"]),
        JSON.stringify(["Yuddhistir", "Bhima", "Arjuna", "Tulasi Devi", "Amrita Kirtan Das"]),
      ]
    );

    const roster = [
      { id: "p-demo-yuddhistir", name: "Yuddhistir", days: pattern(15) },
      { id: "p-demo-bhima", name: "Bhima", days: pattern(12, [13]) },
      { id: "p-demo-arjuna", name: "Arjuna", days: pattern(10, [11]) },
      { id: "p-demo-tulasi", name: "Tulasi Devi", days: pattern(8, [9]) },
      { id: "p-demo-amrita", name: "Amrita Kirtan Das", days: pattern(5, [7, 8]) },
    ];
    for (const p of roster) {
      await client.query(
        `INSERT INTO challenge_participants
          (id, challenge_id, name, accepted, completed_days)
         VALUES ($1,$2,$3,TRUE,$4::jsonb)`,
        [p.id, demoId, p.name, JSON.stringify(p.days)]
      );
    }
    console.log("Seeded demo challenge:", demoId);
  }

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM challenges) AS challenges,
      (SELECT COUNT(*)::int FROM challenge_participants) AS participants,
      (SELECT COUNT(*)::int FROM daily_streaks) AS streaks,
      (SELECT COUNT(*)::int FROM user_shloka_completions) AS shlokas,
      (SELECT COUNT(*)::int FROM user_settings) AS settings
  `);
  console.log("App tables ready:");
  console.table(counts.rows);

  await client.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await client.end();
  } catch {
    /* */
  }
  process.exit(1);
});
