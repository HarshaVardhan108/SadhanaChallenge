/** Shared challenge model + localStorage helpers (client-side). */

export const CHALLENGES_STORAGE_KEY = "bhakti-challenges";

export type ChallengeVisibility = "public" | "private";
export type ChallengeType = "custom" | "shloka";

export type ChallengeParticipant = {
  id: string;
  name: string;
  /** Optional account id when known (login session). */
  userId?: string;
  /** Whether they accepted the invite (creator always accepted). */
  accepted: boolean;
  /** Day index 0..days-1 — true if that day was completed. */
  completedDays: boolean[];
};

export type LocalUserProfile = {
  id?: string;
  fullName: string;
  email?: string | null;
};

export type SavedChallenge = {
  id: string;
  type: ChallengeType;
  name: string;
  days: number;
  visibility: ChallengeVisibility;
  createdAt: string;
  /** Creator display name */
  createdBy: string;
  goal?: string;
  activities?: string[];
  activityLabels?: string[];
  bookId?: string;
  bookName?: string;
  chapterNumber?: number;
  shlokaIds?: string[];
  shlokas?: string[];
  /** Raw invite strings (emails/names) entered at create time */
  invites?: string[];
  participants: ChallengeParticipant[];
};

function emptyDays(n: number): boolean[] {
  return Array.from({ length: Math.max(1, n) }, () => false);
}

export function createParticipant(
  name: string,
  days: number,
  accepted = true,
  userId?: string
): ChallengeParticipant {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim() || "Devotee",
    userId,
    accepted,
    completedDays: emptyDays(days),
  };
}

/** Build participant list: creator first, then invitees (as accepted for tracking). */
export function buildParticipants(
  creatorName: string,
  inviteNames: string[],
  days: number,
  creatorUserId?: string
): ChallengeParticipant[] {
  const list: ChallengeParticipant[] = [
    createParticipant(creatorName || "You", days, true, creatorUserId),
  ];
  const seen = new Set([list[0].name.toLowerCase()]);
  for (const raw of inviteNames) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(createParticipant(name, days, true));
  }
  return list;
}

/** Logged-in profile from localStorage (set on login/register). */
export function getLoggedInUserProfile(): LocalUserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem("bhakti-guest") === "1") return null;
    const raw = localStorage.getItem("bhakti-user");
    if (!raw) return null;
    const u = JSON.parse(raw) as {
      id?: string;
      fullName?: string;
      email?: string | null;
    };
    const fullName = (u.fullName || "").trim();
    if (!fullName && !u.id) return null;
    return {
      id: u.id,
      fullName: fullName || "Devotee",
      email: u.email ?? null,
    };
  } catch {
    return null;
  }
}

/** Display name for create / join (full name preferred). */
export function getCreatorNameFromStorage(): string {
  const profile = getLoggedInUserProfile();
  if (profile?.fullName) return profile.fullName;
  return "You";
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match participant to logged-in user by id, full name, or first name. */
export function participantMatchesUser(
  p: ChallengeParticipant,
  user: LocalUserProfile | null | undefined
): boolean {
  if (!user) return false;
  if (user.id && p.userId && p.userId === user.id) return true;
  const pn = normalizeName(p.name);
  const un = normalizeName(user.fullName);
  if (!pn || !un) return false;
  if (pn === un) return true;
  const pFirst = pn.split(" ")[0];
  const uFirst = un.split(" ")[0];
  if (pFirst && uFirst && pFirst === uFirst) return true;
  return false;
}

export function findMyParticipant(
  challenge: SavedChallenge,
  user: LocalUserProfile | null | undefined
): ChallengeParticipant | null {
  if (!user) return null;
  const accepted = challenge.participants.filter((p) => p.accepted);
  return (
    accepted.find((p) => participantMatchesUser(p, user)) ||
    challenge.participants.find((p) => participantMatchesUser(p, user)) ||
    null
  );
}

/**
 * Add the logged-in user to a public challenge if missing.
 * Returns updated list (and persists).
 */
export function joinChallengeAsUser(
  challengeId: string,
  user: LocalUserProfile
): SavedChallenge[] {
  return updateChallenge(challengeId, (c) => {
    if (findMyParticipant(c, user)) return c;
    const me = createParticipant(
      user.fullName || "Devotee",
      c.days,
      true,
      user.id
    );
    return { ...c, participants: [me, ...c.participants] };
  });
}

/**
 * Only the matching participant may toggle days (enforced for public boards).
 */
export function toggleOwnParticipantDay(
  challengeId: string,
  participantId: string,
  dayIndex: number,
  user: LocalUserProfile | null
): SavedChallenge[] {
  if (!user) return loadChallenges();
  const list = loadChallenges();
  const challenge = list.find((c) => c.id === challengeId);
  if (!challenge) return list;
  const mine = findMyParticipant(challenge, user);
  if (!mine || mine.id !== participantId) return list;
  return toggleParticipantDay(challengeId, participantId, dayIndex);
}

/** Stable id so the demo is only seeded once (unless cleared). */
export const DEMO_PUBLIC_CHALLENGE_ID = "ch-demo-public-kartik-21";

function daysFromPattern(days: number, completedUpTo: number, extra?: number[]): boolean[] {
  return Array.from({ length: days }, (_, i) => {
    if (i < completedUpTo) return true;
    if (extra?.includes(i)) return true;
    return false;
  });
}

/** Sample public challenge with several devotees + partial day progress. */
export function createDemoPublicChallenge(): SavedChallenge {
  const days = 21;
  return {
    id: DEMO_PUBLIC_CHALLENGE_ID,
    type: "custom",
    name: "Kartik Month Sankalpa",
    goal: "Daily japa, reading & gratitude — walk together back home, back to Godhead.",
    days,
    visibility: "public",
    createdAt: new Date().toISOString(),
    createdBy: "Harsha",
    activities: ["chanting", "reading", "gratitude"],
    activityLabels: ["Chanting (japa)", "Reading", "Gratitude journal"],
    invites: [
      "Radha Priya Dasi",
      "Govinda Das",
      "Tulasi Devi",
      "Amrita Kirtan Das",
    ],
    participants: [
      {
        id: "p-demo-harsha",
        name: "Harsha",
        accepted: true,
        completedDays: daysFromPattern(days, 12, [13, 14]),
      },
      {
        id: "p-demo-radha",
        name: "Radha Priya Dasi",
        accepted: true,
        completedDays: daysFromPattern(days, 10, [11]),
      },
      {
        id: "p-demo-govinda",
        name: "Govinda Das",
        accepted: true,
        completedDays: daysFromPattern(days, 8, [9, 11]),
      },
      {
        id: "p-demo-tulasi",
        name: "Tulasi Devi",
        accepted: true,
        completedDays: daysFromPattern(days, 14),
      },
      {
        id: "p-demo-amrita",
        name: "Amrita Kirtan Das",
        accepted: true,
        completedDays: daysFromPattern(days, 5, [7, 8]),
      },
    ],
  };
}

/**
 * Ensures a dummy public challenge exists so the day-grid UI is visible.
 * Does not overwrite if the demo id is already stored.
 */
export function ensureDemoPublicChallenge(): SavedChallenge[] {
  const list = loadChallengesRaw();
  if (list.some((c) => c.id === DEMO_PUBLIC_CHALLENGE_ID)) {
    return list;
  }
  const next = [createDemoPublicChallenge(), ...list];
  saveChallenges(next);
  return next;
}

function loadChallengesRaw(): SavedChallenge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHALLENGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeChallenge).filter(Boolean) as SavedChallenge[];
  } catch {
    return [];
  }
}

export function loadChallenges(): SavedChallenge[] {
  return loadChallengesRaw();
}

/** Load challenges and seed the demo public challenge if missing. */
export function loadChallengesWithDemo(): SavedChallenge[] {
  return ensureDemoPublicChallenge();
}

/** Migrate older challenge shapes (no id / participants). */
function normalizeChallenge(raw: unknown): SavedChallenge | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const days = Math.max(1, Number(c.days) || 7);
  const name =
    typeof c.name === "string" && c.name.trim()
      ? c.name.trim()
      : "Untitled Challenge";
  const type: ChallengeType = c.type === "shloka" ? "shloka" : "custom";
  const visibility: ChallengeVisibility =
    c.visibility === "private" ? "private" : "public";
  const createdAt =
    typeof c.createdAt === "string" ? c.createdAt : new Date().toISOString();
  const createdBy =
    typeof c.createdBy === "string" && c.createdBy.trim()
      ? c.createdBy.trim()
      : "You";
  const invites = Array.isArray(c.invites)
    ? (c.invites as unknown[]).map(String).filter(Boolean)
    : [];

  let participants: ChallengeParticipant[] = [];
  if (Array.isArray(c.participants) && c.participants.length > 0) {
    participants = (c.participants as unknown[]).map((p, i) => {
      const part = (p || {}) as Record<string, unknown>;
      const completedRaw = Array.isArray(part.completedDays)
        ? (part.completedDays as boolean[])
        : emptyDays(days);
      const completedDays = emptyDays(days).map((_, di) =>
        Boolean(completedRaw[di])
      );
      return {
        id:
          typeof part.id === "string"
            ? part.id
            : `p-migrated-${i}-${Date.now()}`,
        name:
          typeof part.name === "string" && part.name.trim()
            ? part.name.trim()
            : `Devotee ${i + 1}`,
        userId: typeof part.userId === "string" ? part.userId : undefined,
        accepted: part.accepted !== false,
        completedDays,
      };
    });
  } else {
    participants = buildParticipants(createdBy, invites, days);
  }

  return {
    id:
      typeof c.id === "string" && c.id
        ? c.id
        : `ch-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name,
    days,
    visibility,
    createdAt,
    createdBy,
    goal: typeof c.goal === "string" ? c.goal : undefined,
    activities: Array.isArray(c.activities)
      ? (c.activities as string[])
      : undefined,
    activityLabels: Array.isArray(c.activityLabels)
      ? (c.activityLabels as string[])
      : undefined,
    bookId: typeof c.bookId === "string" ? c.bookId : undefined,
    bookName: typeof c.bookName === "string" ? c.bookName : undefined,
    chapterNumber:
      typeof c.chapterNumber === "number" ? c.chapterNumber : undefined,
    shlokaIds: Array.isArray(c.shlokaIds)
      ? (c.shlokaIds as string[])
      : undefined,
    shlokas: Array.isArray(c.shlokas) ? (c.shlokas as string[]) : undefined,
    invites,
    participants,
  };
}

export function saveChallenges(list: SavedChallenge[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(list));
}

export function prependChallenge(challenge: SavedChallenge): void {
  const existing = loadChallenges();
  saveChallenges([challenge, ...existing]);
}

export function updateChallenge(
  id: string,
  updater: (c: SavedChallenge) => SavedChallenge
): SavedChallenge[] {
  const list = loadChallenges();
  const next = list.map((c) => (c.id === id ? updater(c) : c));
  saveChallenges(next);
  return next;
}

/** Toggle one day completion for a participant. */
export function toggleParticipantDay(
  challengeId: string,
  participantId: string,
  dayIndex: number
): SavedChallenge[] {
  return updateChallenge(challengeId, (c) => ({
    ...c,
    participants: c.participants.map((p) => {
      if (p.id !== participantId) return p;
      const completedDays = [...p.completedDays];
      while (completedDays.length < c.days) completedDays.push(false);
      if (dayIndex >= 0 && dayIndex < completedDays.length) {
        completedDays[dayIndex] = !completedDays[dayIndex];
      }
      return { ...p, completedDays };
    }),
  }));
}

export function participantCompletedCount(p: ChallengeParticipant): number {
  return p.completedDays.filter(Boolean).length;
}

export function challengeProgress(c: SavedChallenge): {
  completed: number;
  total: number;
  pct: number;
} {
  const accepted = c.participants.filter((p) => p.accepted);
  const total = accepted.length * c.days;
  const completed = accepted.reduce(
    (sum, p) => sum + participantCompletedCount(p),
    0
  );
  return {
    completed,
    total: Math.max(1, total),
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function newChallengeId(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Canonical URL for a saved challenge detail page. */
export function challengePath(id: string): string {
  return `/challenges/${encodeURIComponent(id)}`;
}

/** Load one challenge by id (with demo seed if needed). */
export function getChallengeById(id: string): SavedChallenge | null {
  if (!id) return null;
  const list = loadChallengesWithDemo();
  return list.find((c) => c.id === id) ?? null;
}

/** Static create routes under /challenges — not dynamic challenge ids. */
export const CHALLENGE_STATIC_SEGMENTS = new Set([
  "custom",
  "shloka",
  "7-day",
  "21-day",
]);

export function isChallengeDetailId(segment: string): boolean {
  if (!segment || CHALLENGE_STATIC_SEGMENTS.has(segment)) return false;
  return true;
}

/** Locale-stable date label (avoids SSR/client toLocaleDateString mismatches). */
export function formatChallengeDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  } catch {
    return "";
  }
}
