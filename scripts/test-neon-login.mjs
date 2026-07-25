import pg from "pg";
import fs from "fs";

// load .env.local
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) {
    const k = m[1].trim();
    const v = m[2].trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const r = await client.query(
  `SELECT id, full_name, email, password_hash FROM users WHERE lower(email) = $1`,
  ["harsha@example.com"]
);
console.log("Neon user:", r.rows[0]);
console.log("Password ok:", r.rows[0]?.password_hash === "admin123");
await client.end();
