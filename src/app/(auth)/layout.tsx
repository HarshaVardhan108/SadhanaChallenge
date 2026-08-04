import { cookies } from "next/headers";
import { IntroSplash } from "@/components/ambient/IntroSplash";
import { INTRO_SESSION_KEY } from "@/lib/intro";

/**
 * Shared shell for /login and /register.
 * Shows a Divine Connection intro once per browser session.
 * User must tap BEGIN JOURNEY — no auto-skip to login.
 *
 * Return visits: session cookie (set when intro finishes) lets the
 * server skip the splash — no client <script> needed (React 19 safe).
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const introDone = jar.get(INTRO_SESSION_KEY)?.value === "1";

  return (
    <>
      {!introDone && <IntroSplash />}
      {children}
    </>
  );
}
