import pg from "pg";
const c = new pg.Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "admin123",
  database: "svupat2026",
});
await c.connect();
const r = await c.query(
  "SELECT id, email, left(password_hash, 20) as hash_prefix, length(password_hash) as len FROM admins LIMIT 5"
);
console.log(r.rows);
const s = await c.query(
  "SELECT id, full_name, email, whatsapp_number FROM student_details LIMIT 5"
);
console.log("students", s.rows);
await c.end();
