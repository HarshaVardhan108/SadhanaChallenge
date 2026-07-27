import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

let client: ConvexHttpClient | null = null;

/** Public Convex deployment URL (from `npx convex dev`). */
export function getConvexUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    process.env.CONVEX_URL ||
    null
  );
}

export function getConvexClient(): ConvexHttpClient {
  const url = getConvexUrl();
  if (!url) {
    throw new Error(
      "Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL (run `npx convex dev`)."
    );
  }
  if (!client) {
    client = new ConvexHttpClient(url);
  }
  return client;
}

export function isConvexError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Convex is not configured|NEXT_PUBLIC_CONVEX_URL|Failed to fetch|NetworkError|ECONNREFUSED|fetch failed|convex/i.test(
      msg
    )
  );
}

export { api };
