"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isGuestPublicPath, isGuestUser } from "@/lib/guest";

function guestMayView(pathname: string): boolean {
  if (!isGuestUser()) return true;
  return isGuestPublicPath(pathname);
}

/**
 * Guests may only use the dashboard (and auth / please-login pages).
 * Any other app route redirects to the Please login page.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // SSR: allow; client re-checks immediately so guests don't see restricted UI
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (guestMayView(pathname)) {
      setAllowed(true);
      return;
    }
    setAllowed(false);
    const next = encodeURIComponent(pathname || "/dashboard");
    router.replace(`/please-login?next=${next}`);
  }, [pathname, router]);

  // Avoid flashing restricted content while redirecting guests
  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
