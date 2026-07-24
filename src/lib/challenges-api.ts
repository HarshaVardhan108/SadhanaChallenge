/**
 * Client helpers to load/save challenges via /api (PostgreSQL).
 * Falls back to localStorage only for guests / offline.
 */
import type { SavedChallenge } from "@/lib/challenges";
import {
  CHALLENGES_STORAGE_KEY,
  loadChallenges as loadLocal,
  saveChallenges as saveLocal,
} from "@/lib/challenges";

export async function fetchChallengesFromApi(): Promise<SavedChallenge[] | null> {
  try {
    const res = await fetch("/api/challenges", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      ok?: boolean;
      challenges?: SavedChallenge[];
    };
    if (!data.ok || !Array.isArray(data.challenges)) return null;
    return data.challenges;
  } catch {
    return null;
  }
}

export async function fetchChallengeById(
  id: string
): Promise<SavedChallenge | null> {
  try {
    const res = await fetch(`/api/challenges/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { challenge?: SavedChallenge };
    return data.challenge ?? null;
  } catch {
    return null;
  }
}

export async function persistChallengeToApi(
  challenge: SavedChallenge
): Promise<SavedChallenge | null> {
  try {
    const res = await fetch("/api/challenges", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { challenge?: SavedChallenge };
    return data.challenge ?? null;
  } catch {
    return null;
  }
}

export async function patchChallengeApi(
  id: string,
  body: Record<string, unknown>
): Promise<SavedChallenge | null> {
  try {
    const res = await fetch(`/api/challenges/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { challenge?: SavedChallenge };
    return data.challenge ?? null;
  } catch {
    return null;
  }
}

/**
 * Load challenges preferring DB when logged in.
 * Merges into localStorage cache for offline reads.
 */
export async function loadChallengesAsync(
  isGuest: boolean
): Promise<SavedChallenge[]> {
  if (!isGuest) {
    const fromApi = await fetchChallengesFromApi();
    if (fromApi) {
      try {
        saveLocal(fromApi);
      } catch {
        /* ignore */
      }
      return fromApi;
    }
  }
  return loadLocal();
}

/** Save full challenge list: push each to API when logged in, always cache locally. */
export async function saveChallengesAsync(
  list: SavedChallenge[],
  isGuest: boolean
): Promise<void> {
  saveLocal(list);
  if (isGuest) return;
  // Best-effort upsert of all (for migrations from local)
  await Promise.all(
    list.map((c) => persistChallengeToApi(c).catch(() => null))
  );
}

export { CHALLENGES_STORAGE_KEY };
