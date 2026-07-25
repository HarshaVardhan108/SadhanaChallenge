import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

/**
 * Build pool config for local Postgres or hosted (Supabase / Neon / Vercel).
 *
 * Prefer a single connection string on Vercel:
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres
 *
 * Or discrete vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * Set DB_SSL=true when the host requires SSL (Supabase always does).
 */
function buildPoolConfig(): PoolConfig {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  const sslFlag = (process.env.DB_SSL || "").toLowerCase();
  const forceSsl = sslFlag === "true" || sslFlag === "1" || sslFlag === "require";
  const forceNoSsl = sslFlag === "false" || sslFlag === "0" || sslFlag === "disable";

  const looksRemote = (hostOrUrl: string) =>
    /supabase\.co|neon\.tech|vercel-storage|amazonaws\.com|pooler\.|render\.com|railway\.app/i.test(
      hostOrUrl
    );

  if (connectionString) {
    // Neon / serverless: drop channel_binding (breaks some runtimes) and
    // use libpq-compatible SSL flags expected by `pg` on Vercel.
    let url = connectionString
      .replace(/&?channel_binding=require/gi, "")
      .replace(/[?&]$/, "");
    if (!/[?&]sslmode=/i.test(url)) {
      url += (url.includes("?") ? "&" : "?") + "sslmode=require";
    }
    if (!/[?&]uselibpqcompat=/i.test(url)) {
      url += "&uselibpqcompat=true";
    }

    const useSsl =
      !forceNoSsl &&
      (forceSsl ||
        looksRemote(url) ||
        process.env.NODE_ENV === "production");

    return {
      connectionString: url,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      // Serverless: keep pool small; rely on external pooler when available
      max: Number(process.env.DB_POOL_MAX || 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    };
  }

  const host = process.env.DB_HOST || "localhost";
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const useSsl =
    !forceNoSsl &&
    (forceSsl || (!isLocal && (looksRemote(host) || process.env.NODE_ENV === "production")));

  return {
    host,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "SadhanaChallenge",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "admin123",
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  };
}

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool(buildPoolConfig());
    globalForPg.pgPool.on("error", (err) => {
      console.error("Unexpected Postgres pool error", err);
    });
  }
  return globalForPg.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}

/** True when a thrown error looks like a DB connectivity / auth problem. */
export function isDatabaseError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  return (
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|connection|timeout|password authentication|SSL|database|does not exist|getaddrinfo|no pg_hba|too many clients/i.test(
      msg
    ) ||
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "28P01", "3D000", "28000"].includes(
      code
    )
  );
}

export type DbUser = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  temple: string | null;
  city: string | null;
  country: string | null;
  avatar_url?: string | null;
  invite_code?: string | null;
  invited_by_user_id?: string | null;
  created_at: Date;
};
