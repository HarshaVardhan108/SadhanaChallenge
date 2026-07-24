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

/** Invite entry: plain name/email string, or a registered user with id. */
export type ChallengeInviteInput =
  | string
  | { name: string; userId?: string; email?: string | null };

function inviteDisplayName(inv: ChallengeInviteInput): string {
  if (typeof inv === "string") return inv.trim();
  return (inv.name || inv.email || "").trim();
}

function inviteUserId(inv: ChallengeInviteInput): string | undefined {
  if (typeof inv === "string") return undefined;
  return inv.userId;
}

/** Build participant list: creator first, then invitees (as accepted for tracking). */
export function buildParticipants(
  creatorName: string,
  invites: ChallengeInviteInput[],
  days: number,
  creatorUserId?: string
): ChallengeParticipant[] {
  const list: ChallengeParticipant[] = [
    createParticipant(creatorName || "You", days, true, creatorUserId),
  ];
  const seenNames = new Set([list[0].name.toLowerCase()]);
  const seenIds = new Set<string>(
    creatorUserId ? [creatorUserId] : []
  );

  for (const inv of invites) {
    const name = inviteDisplayName(inv);
    const userId = inviteUserId(inv);
    if (!name && !userId) continue;
    if (userId && seenIds.has(userId)) continue;
    const key = (name || userId || "").toLowerCase();
    if (key && seenNames.has(key)) continue;
    if (name) seenNames.add(name.toLowerCase());
    if (userId) seenIds.add(userId);
    list.push(createParticipant(name || "Devotee", days, true, userId));
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
  // Started ~15 days ago so past days show completed/missed; current day is active (24h window).
  const startedMs =
    Date.now() - 15 * MS_PER_CHALLENGE_DAY + 3 * 60 * 60 * 1000;
  return {
    id: DEMO_PUBLIC_CHALLENGE_ID,
    type: "custom",
    name: "Kartik Month Sankalpa",
    goal: "Daily japa, reading & gratitude — walk together back home, back to Godhead. Each day has a 24-hour window — mark complete before time runs out.",
    days,
    visibility: "public",
    createdAt: new Date(startedMs).toISOString(),
    createdBy: "Harsha",
    activities: ["chanting", "reading", "gratitude"],
    activityLabels: ["Chanting (japa)", "Reading", "Gratitude journal"],
    invites: ["Yuddhistir", "Bhima", "Arjuna", "Tulasi Devi", "Amrita Kirtan Das"],
    participants: [
      {
        id: "p-demo-yuddhistir",
        name: "Yuddhistir",
        accepted: true,
        // 1st on podium — golden
        completedDays: daysFromPattern(days, 15),
      },
      {
        id: "p-demo-bhima",
        name: "Bhima",
        accepted: true,
        // 2nd on podium — blue
        completedDays: daysFromPattern(days, 12, [13]),
      },
      {
        id: "p-demo-arjuna",
        name: "Arjuna",
        accepted: true,
        // 3rd on podium — light pink
        completedDays: daysFromPattern(days, 10, [11]),
      },
      {
        id: "p-demo-tulasi",
        name: "Tulasi Devi",
        accepted: true,
        completedDays: daysFromPattern(days, 8, [9]),
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
 * Refreshes the fixed demo roster when it still looks like sample data
 * (all participant ids are p-demo-*), so podium names stay current.
 */
export function ensureDemoPublicChallenge(): SavedChallenge[] {
  const list = loadChallengesRaw();
  const existingIdx = list.findIndex((c) => c.id === DEMO_PUBLIC_CHALLENGE_ID);
  if (existingIdx === -1) {
    const next = [createDemoPublicChallenge(), ...list];
    saveChallenges(next);
    return next;
  }

  const existing = list[existingIdx];
  const isPureDemoRoster =
    existing.participants.length > 0 &&
    existing.participants.every((p) => p.id.startsWith("p-demo-"));
  const hasPodiumNames = ["Yuddhistir", "Bhima", "Arjuna"].every((n) =>
    existing.participants.some((p) => p.name === n)
  );

  if (!isPureDemoRoster || hasPodiumNames) {
    return list;
  }

  // Upgrade legacy demo names/scores without wiping real joiners.
  const fresh = createDemoPublicChallenge();
  const next = list.map((c, i) =>
    i === existingIdx
      ? {
          ...c,
          invites: fresh.invites,
          participants: fresh.participants,
        }
      : c
  );
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

/** One challenge day = 24 hours from challenge start (createdAt). */
export const MS_PER_CHALLENGE_DAY = 24 * 60 * 60 * 1000;

/**
 * Day status relative to the challenge clock:
 * - upcoming: window not started yet
 * - active: current 24h window (only then can mark complete)
 * - completed: marked done (counts toward progress)
 * - missed: window ended without complete (red X, does not count)
 */
export type ChallengeDayStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "missed";

export function getChallengeStartMs(createdAt: string): number {
  const t = new Date(createdAt).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

/** Inclusive start of the 24h window for dayIndex (0-based). */
export function getDayWindowStartMs(
  createdAt: string,
  dayIndex: number
): number {
  return getChallengeStartMs(createdAt) + dayIndex * MS_PER_CHALLENGE_DAY;
}

/** Exclusive end of the 24h window for dayIndex. */
export function getDayWindowEndMs(createdAt: string, dayIndex: number): number {
  return getDayWindowStartMs(createdAt, dayIndex) + MS_PER_CHALLENGE_DAY;
}

export function getDayStatus(
  createdAt: string,
  dayIndex: number,
  markedComplete: boolean,
  nowMs: number = Date.now()
): ChallengeDayStatus {
  if (markedComplete) return "completed";
  const start = getDayWindowStartMs(createdAt, dayIndex);
  const end = start + MS_PER_CHALLENGE_DAY;
  if (nowMs < start) return "upcoming";
  if (nowMs < end) return "active";
  return "missed";
}

/** Only the current 24h window may be toggled. Past missed/completed and future days are locked. */
export function canToggleChallengeDay(
  createdAt: string,
  dayIndex: number,
  nowMs: number = Date.now()
): boolean {
  if (dayIndex < 0) return false;
  const start = getDayWindowStartMs(createdAt, dayIndex);
  const end = start + MS_PER_CHALLENGE_DAY;
  return nowMs >= start && nowMs < end;
}

/** 0-based index of the day whose 24h window contains `now`, or -1 / days if outside range. */
export function getActiveDayIndex(
  createdAt: string,
  days: number,
  nowMs: number = Date.now()
): number {
  const start = getChallengeStartMs(createdAt);
  if (nowMs < start) return -1;
  const idx = Math.floor((nowMs - start) / MS_PER_CHALLENGE_DAY);
  if (idx < 0) return -1;
  if (idx >= days) return days; // challenge finished
  return idx;
}

export type ParticipantActiveDayAction = {
  participantId: string;
  dayIndex: number;
  dayNumber: number;
  isComplete: boolean;
  /** True when inside the 24h window (can mark or unmark). */
  canToggle: boolean;
  /** True when inside window and not yet complete — show "Mark as complete". */
  canMarkComplete: boolean;
  phase: "not_started" | "active" | "finished";
};

/**
 * Current day action for a joined participant (for Mark as complete UI).
 * Returns null if the user is not in the challenge.
 */
export function getParticipantActiveDayAction(
  challenge: SavedChallenge,
  user: LocalUserProfile | null | undefined,
  nowMs: number = Date.now()
): ParticipantActiveDayAction | null {
  const mine = findMyParticipant(challenge, user);
  if (!mine) return null;

  const idx = getActiveDayIndex(challenge.createdAt, challenge.days, nowMs);
  if (idx < 0) {
    return {
      participantId: mine.id,
      dayIndex: -1,
      dayNumber: 0,
      isComplete: false,
      canToggle: false,
      canMarkComplete: false,
      phase: "not_started",
    };
  }
  if (idx >= challenge.days) {
    return {
      participantId: mine.id,
      dayIndex: challenge.days - 1,
      dayNumber: challenge.days,
      isComplete: Boolean(mine.completedDays[challenge.days - 1]),
      canToggle: false,
      canMarkComplete: false,
      phase: "finished",
    };
  }

  const isComplete = Boolean(mine.completedDays[idx]);
  const canToggle = canToggleChallengeDay(challenge.createdAt, idx, nowMs);
  return {
    participantId: mine.id,
    dayIndex: idx,
    dayNumber: idx + 1,
    isComplete,
    canToggle,
    canMarkComplete: canToggle && !isComplete,
    phase: "active",
  };
}

/**
 * Mark the active day complete for the logged-in participant (sets true; does not unmark).
 */
export function markOwnActiveDayComplete(
  challengeId: string,
  user: LocalUserProfile | null,
  nowMs: number = Date.now()
): SavedChallenge[] {
  if (!user) return loadChallenges();
  const list = loadChallenges();
  const challenge = list.find((c) => c.id === challengeId);
  if (!challenge) return list;

  const action = getParticipantActiveDayAction(challenge, user, nowMs);
  if (!action || !action.canMarkComplete) return list;

  return updateChallenge(challengeId, (c) => ({
    ...c,
    participants: c.participants.map((p) => {
      if (p.id !== action.participantId) return p;
      const completedDays = [...p.completedDays];
      while (completedDays.length < c.days) completedDays.push(false);
      if (action.dayIndex >= 0 && action.dayIndex < completedDays.length) {
        completedDays[action.dayIndex] = true;
      }
      return { ...p, completedDays };
    }),
  }));
}

/**
 * Completed days that count toward score.
 * Missed days (window expired, not marked) never count.
 */
export function participantCompletedCount(
  p: ChallengeParticipant,
  challenge?: Pick<SavedChallenge, "createdAt" | "days">,
  nowMs: number = Date.now()
): number {
  if (!challenge) {
    return p.completedDays.filter(Boolean).length;
  }
  let n = 0;
  const limit = Math.min(p.completedDays.length, challenge.days);
  for (let i = 0; i < limit; i++) {
    if (
      getDayStatus(challenge.createdAt, i, Boolean(p.completedDays[i]), nowMs) ===
      "completed"
    ) {
      n += 1;
    }
  }
  return n;
}

export function participantMissedCount(
  p: ChallengeParticipant,
  challenge: Pick<SavedChallenge, "createdAt" | "days">,
  nowMs: number = Date.now()
): number {
  let n = 0;
  for (let i = 0; i < challenge.days; i++) {
    if (
      getDayStatus(
        challenge.createdAt,
        i,
        Boolean(p.completedDays[i]),
        nowMs
      ) === "missed"
    ) {
      n += 1;
    }
  }
  return n;
}

/** Toggle one day completion for a participant (only during that day's 24h window). */
export function toggleParticipantDay(
  challengeId: string,
  participantId: string,
  dayIndex: number
): SavedChallenge[] {
  return updateChallenge(challengeId, (c) => {
    if (!canToggleChallengeDay(c.createdAt, dayIndex)) {
      return c;
    }
    return {
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
    };
  });
}

export function challengeProgress(
  c: SavedChallenge,
  nowMs: number = Date.now()
): {
  completed: number;
  total: number;
  pct: number;
  missed: number;
} {
  const accepted = c.participants.filter((p) => p.accepted);
  const total = accepted.length * c.days;
  const completed = accepted.reduce(
    (sum, p) => sum + participantCompletedCount(p, c, nowMs),
    0
  );
  const missed = accepted.reduce(
    (sum, p) => sum + participantMissedCount(p, c, nowMs),
    0
  );
  return {
    completed,
    total: Math.max(1, total),
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    missed,
  };
}

export function newChallengeId(): string {
  return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Canonical URL for a saved challenge detail page. */
export function challengePath(id: string): string {
  return `/challenges/${encodeURIComponent(id)}`;
}

/**
 * Public challenges the user created or joined (accepted participant).
 * Used by the Leaderboard page.
 */
export function getMyPublicChallenges(
  list: SavedChallenge[],
  user: LocalUserProfile | null | undefined
): SavedChallenge[] {
  if (!user) return [];
  return list.filter((c) => {
    if (c.visibility !== "public") return false;
    if (findMyParticipant(c, user)) return true;
    // Creator may not yet be in participants on older data
    const by = normalizeName(c.createdBy);
    const un = normalizeName(user.fullName);
    if (by && un && (by === un || by.split(" ")[0] === un.split(" ")[0])) {
      return true;
    }
    return false;
  });
}

/**
 * Challenges the user created or joined (public + private).
 * Used by dashboard / Lotus Garden so it stays in sync with Challenges.
 */
export function getMyJoinedChallenges(
  list: SavedChallenge[],
  user: LocalUserProfile | null | undefined
): SavedChallenge[] {
  if (!user) return [];
  return list.filter((c) => {
    if (findMyParticipant(c, user)) return true;
    const by = normalizeName(c.createdBy);
    const un = normalizeName(user.fullName);
    if (by && un && (by === un || by.split(" ")[0] === un.split(" ")[0])) {
      return true;
    }
    return false;
  });
}

/**
 * A shloka challenge is completed when its full day window has finished
 * (all N days' 24h windows are over).
 */
export function isShlokaChallengeCompleted(
  challenge: SavedChallenge,
  nowMs: number = Date.now()
): boolean {
  if (challenge.type !== "shloka") return true;
  const idx = getActiveDayIndex(challenge.createdAt, challenge.days, nowMs);
  return idx >= challenge.days;
}

/**
 * Shloka create rule:
 * - Incomplete public shloka → cannot create another public until it finishes
 * - Incomplete private shloka → cannot create another private until it finishes
 * (Visibility is free again after the active one of that type completes.)
 */
export function getShlokaVisibilityConstraint(
  list: SavedChallenge[],
  user: LocalUserProfile | null | undefined,
  nowMs: number = Date.now()
): {
  allowPublic: boolean;
  allowPrivate: boolean;
  forced: ChallengeVisibility | null;
  message: string | null;
  blockingPublic: SavedChallenge | null;
  blockingPrivate: SavedChallenge | null;
} {
  if (!user) {
    return {
      allowPublic: true,
      allowPrivate: true,
      forced: null,
      message: null,
      blockingPublic: null,
      blockingPrivate: null,
    };
  }

  const mine = getMyJoinedChallenges(list, user).filter(
    (c) => c.type === "shloka"
  );

  const incompletePublic = mine.find(
    (c) => c.visibility === "public" && !isShlokaChallengeCompleted(c, nowMs)
  );
  const incompletePrivate = mine.find(
    (c) => c.visibility === "private" && !isShlokaChallengeCompleted(c, nowMs)
  );

  const allowPublic = !incompletePublic;
  const allowPrivate = !incompletePrivate;

  let forced: ChallengeVisibility | null = null;
  if (allowPublic && !allowPrivate) forced = "public";
  if (allowPrivate && !allowPublic) forced = "private";

  let message: string | null = null;
  if (incompletePublic && incompletePrivate) {
    message = `Finish your active public (“${incompletePublic.name}”) and private (“${incompletePrivate.name}”) shloka challenges before creating new ones.`;
  } else if (incompletePublic) {
    message = `You already have an active public shloka challenge (“${incompletePublic.name}”). Finish all ${incompletePublic.days} days before creating another public one.`;
  } else if (incompletePrivate) {
    message = `You already have an active private shloka challenge (“${incompletePrivate.name}”). Finish all ${incompletePrivate.days} days before creating another private one.`;
  }

  return {
    allowPublic,
    allowPrivate,
    forced,
    message,
    blockingPublic: incompletePublic ?? null,
    blockingPrivate: incompletePrivate ?? null,
  };
}

/** Longest consecutive completed-day run for a participant. */
export function participantBestStreak(
  p: ChallengeParticipant,
  challenge: Pick<SavedChallenge, "createdAt" | "days">,
  nowMs: number = Date.now()
): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < challenge.days; i++) {
    const status = getDayStatus(
      challenge.createdAt,
      i,
      Boolean(p.completedDays[i]),
      nowMs
    );
    if (status === "completed") {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

export type LotusGardenStats = {
  /** Days completed by the user across joined challenges */
  completed: number;
  /** Total challenge days across those challenges */
  total: number;
  percent: number;
  challengeCount: number;
  bestStreak: number;
  /** Primary challenge for labels (most progress, then newest) */
  primary: SavedChallenge | null;
};

/**
 * Aggregate sadhana for Lotus Garden — mirrors real challenge day completion.
 */
export function getLotusGardenStats(
  list: SavedChallenge[],
  user: LocalUserProfile | null | undefined,
  nowMs: number = Date.now()
): LotusGardenStats {
  const mine = getMyJoinedChallenges(list, user);
  if (!user || mine.length === 0) {
    return {
      completed: 0,
      total: 21,
      percent: 0,
      challengeCount: 0,
      bestStreak: 0,
      primary: null,
    };
  }

  let completed = 0;
  let total = 0;
  let bestStreak = 0;
  let primary: SavedChallenge | null = null;
  let primaryDone = -1;

  for (const c of mine) {
    const p = findMyParticipant(c, user);
    if (!p) continue;
    const done = participantCompletedCount(p, c, nowMs);
    completed += done;
    total += c.days;
    bestStreak = Math.max(bestStreak, participantBestStreak(p, c, nowMs));
    if (
      done > primaryDone ||
      (done === primaryDone &&
        primary &&
        new Date(c.createdAt).getTime() > new Date(primary.createdAt).getTime())
    ) {
      primaryDone = done;
      primary = c;
    }
  }

  const safeTotal = Math.max(1, total);
  return {
    completed,
    total: safeTotal,
    percent: Math.round((completed / safeTotal) * 100),
    challengeCount: mine.length,
    bestStreak,
    primary,
  };
}

export type LeaderboardRow = {
  participantId: string;
  name: string;
  daysCompleted: number;
  rank: number;
  isYou: boolean;
};

/**
 * Dense ranking: same score shares the same rank; next distinct score
 * gets the next consecutive rank (no skip).
 * e.g. days [12, 12, 10, 8] → ranks [1, 1, 2, 3]
 * So 2nd and 3rd ranks still appear after ties for 1st.
 */
export function assignTiedRanks(scores: number[]): number[] {
  const ranks: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    if (i === 0) {
      ranks.push(1);
    } else if (scores[i] === scores[i - 1]) {
      ranks.push(ranks[i - 1]);
    } else {
      // Next rank after previous group (dense: 1,1,2 not 1,1,3)
      ranks.push(ranks[i - 1] + 1);
    }
  }
  return ranks;
}

/** Rank accepted devotees by days completed (missed days do not count). Ties share rank. */
export function getChallengeLeaderboardRows(
  challenge: SavedChallenge,
  user?: LocalUserProfile | null,
  nowMs: number = Date.now()
): LeaderboardRow[] {
  const accepted = challenge.participants.filter((p) => p.accepted);
  const sorted = accepted
    .map((p) => ({
      participantId: p.id,
      name: p.name,
      daysCompleted: participantCompletedCount(p, challenge, nowMs),
      isYou: Boolean(user && participantMatchesUser(p, user)),
    }))
    .sort(
      (a, b) =>
        b.daysCompleted - a.daysCompleted || a.name.localeCompare(b.name)
    );

  const ranks = assignTiedRanks(sorted.map((r) => r.daysCompleted));
  return sorted.map((row, i) => ({
    ...row,
    rank: ranks[i],
  }));
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
