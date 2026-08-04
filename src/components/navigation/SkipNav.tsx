/**
 * SkipNav — Allows keyboard users to skip directly to the main content.
 * Visible only when focused (sr-only + focus:not-sr-only).
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Pular para o conteúdo principal
    </a>
  );
}
