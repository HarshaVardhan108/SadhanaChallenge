import pg from "pg";

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "admin123",
  database: process.env.DB_NAME || "SadhanaChallenge",
};

/** Plain-text password (no hashing). */
const DEMO_PASSWORD = "admin123";

const client = new pg.Client(config);

async function main() {
  await client.connect();
  console.log("Connected to", config.database);

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
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
    );
  `);

  // Existing DBs: add avatar_url if missing
  await client.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  `);

  // gen_random_uuid needs pgcrypto on some PG versions; fallback if missing
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  } catch {
    console.log("pgcrypto optional");
  }

  // Ensure uuid works
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'gen_random_uuid'
      ) THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;
  `);

  // Recreate table with uuid-ossp if needed
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
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Seed demo users (email + phone login) — plain-text passwords
  await client.query(
    `
    INSERT INTO users (full_name, email, phone, password_hash, temple, city)
    VALUES
      ($1, $2, $3, $4, $5, $6),
      ($7, $8, $9, $10, $11, $12)
    ON CONFLICT DO NOTHING
    `,
    [
      "Harsha",
      "harsha@example.com",
      "9705822395",
      DEMO_PASSWORD,
      "ISKCON Bangalore",
      "Bangalore",
      "Demo Devotee",
      "devotee@example.com",
      "9876543210",
      DEMO_PASSWORD,
      "ISKCON Bangalore",
      "Bangalore",
    ]
  );

  // Handle ON CONFLICT for unique columns separately if empty inserts failed
  const existing = await client.query(`SELECT email, phone FROM users`);
  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, temple, city)
       VALUES ($1,$2,$3,$4,$5,$6), ($7,$8,$9,$10,$11,$12)`,
      [
        "Harsha",
        "harsha@example.com",
        "9705822395",
        DEMO_PASSWORD,
        "ISKCON Bangalore",
        "Bangalore",
        "Demo Devotee",
        "devotee@example.com",
        "9876543210",
        DEMO_PASSWORD,
        "ISKCON Bangalore",
        "Bangalore",
      ]
    );
  } else {
    // Upsert by email — refresh passwords to plain text
    for (const u of [
      {
        name: "Harsha",
        email: "harsha@example.com",
        phone: "9705822395",
      },
      {
        name: "Demo Devotee",
        email: "devotee@example.com",
        phone: "9876543210",
      },
    ]) {
      await client.query(
        `
        INSERT INTO users (full_name, email, phone, password_hash, temple, city)
        VALUES ($1, $2, $3, $4, 'ISKCON Bangalore', 'Bangalore')
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          phone = EXCLUDED.phone,
          full_name = EXCLUDED.full_name,
          updated_at = NOW()
        `,
        [u.name, u.email, u.phone, DEMO_PASSWORD]
      );
    }
  }

  const rows = await client.query(
    `SELECT id, full_name, email, phone, password_hash AS password FROM users`
  );
  console.log("Users ready:");
  console.table(rows.rows);
  console.log("\nLogin with email OR phone + password: admin123");

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
