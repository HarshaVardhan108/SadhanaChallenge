import pg from "pg";
const c = new pg.Client({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "admin123",
  database: process.env.DB_NAME || "SadhanaChallenge",
});
await c.connect();
const r = await c.query(
  `SELECT to_regclass('public.push_subscriptions') AS table_name`
);
console.log(r.rows[0]);
const c2 = await c.query(`SELECT COUNT(*)::int AS n FROM push_subscriptions`);
console.log("subscriptions:", c2.rows[0].n);
await c.end();
