import { IntroSplash } from "@/components/ambient/IntroSplash";

/**
 * Shared shell for /login and /register.
 * Shows a Netflix-style intro once per browser session.
 *
 * A blocking inline script runs before paint so:
 * - First visit: intro is present in SSR HTML (covers login immediately)
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
