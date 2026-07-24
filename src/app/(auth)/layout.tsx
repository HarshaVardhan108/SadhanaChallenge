import { IntroSplash } from "@/components/ambient/IntroSplash";

/**
 * Shared shell for /login and /register.
 * Shows a Divine Connection intro once per browser session.
 * User must tap BEGIN JOURNEY — no auto-skip to login.
 *
 * A blocking inline script runs before paint so:
 * - First visit: intro covers login immediately
 * - Return visit: data-intro-done hides the splash before first paint
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(sessionStorage.getItem("bhakti-intro-played")==="1"){document.documentElement.setAttribute("data-intro-done","1")}}catch(e){}})();`,
        }}
      />
      <IntroSplash />
      {children}
    </>
  );
}
