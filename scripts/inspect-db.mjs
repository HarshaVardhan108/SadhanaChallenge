import pg from "pg";

const { Client } = pg;

async function tryDb(name) {
  const c = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "admin123",
    database: name,
  });
  try {
    await c.connect();
    console.log("CONNECTED", name);
    const r = await c.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`
    );
    console.log(
      "tables",
      r.rows.map((x) => x.table_name)
    );
    for (const t of r.rows) {
      const cols = await c.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
         ORDER BY ordinal_position`,
        [t.table_name]
      );
      console.log("---", t.table_name);
      console.log(cols.rows);
      if (
        /user|auth|login|devotee|member|account/i.test(t.table_name)
      ) {
        const sample = await c.query(
          `SELECT * FROM "${t.table_name}" LIMIT 3`
        );
        console.log("sample", sample.rows);
      }
    }
    await c.end();
    return true;
  } catch (e) {
    console.log("FAIL", name, e.message);
    try {
      await c.end();
    } catch {
      /* */
    }
    return false;
  }
}

for (const n of [
  "svupat2026",
  "SadhanaChallenge",
  "sadhanachallenge",
  "postgres",
]) {
  await tryDb(n);
}
