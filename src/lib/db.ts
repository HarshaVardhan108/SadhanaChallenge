import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "SadhanaChallenge",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "admin123",
      max: 10,
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
  created_at: Date;
};
