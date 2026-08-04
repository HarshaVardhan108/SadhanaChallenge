/** Client-side guest session helpers (localStorage flag set on "Continue as Guest"). */

export const GUEST_STORAGE_KEY = "bhakti-guest";

/** Routes guests may open without logging in. */
export const GUEST_ALLOWED_PATHS = ["/dashboard", "/study"] as const;

export function isGuestUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearGuestFlag(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isGuestAllowedPath(pathname: string): boolean {
  if (!pathname) return false;
  return GUEST_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Please-login page + auth routes are always reachable for guests. */
export function isGuestPublicPath(pathname: string): boolean {
  if (isGuestAllowedPath(pathname)) return true;
  if (pathname === "/please-login" || pathname.startsWith("/please-login/")) {
    return true;
  }
  if (pathname === "/login" || pathname.startsWith("/login")) return true;
  if (pathname === "/register" || pathname.startsWith("/register")) return true;
  // Public challenge detail: /challenges/ch-... (not create routes)
  if (/^\/challenges\/ch-[\w.-]+$/.test(pathname)) return true;
  return false;
}
