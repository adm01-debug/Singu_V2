import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ACTIVE_THEME_STORAGE_KEY, bootstrapTheme } from "@/components/theme/themeBootstrap";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { ProviderErrorBoundary } from "@/components/feedback/ProviderErrorBoundary";
import { logger } from "@/lib/logger";
import App from "./App.tsx";
import "./index.css";

// ── Global system initialization ───────────────────────────────────────────
initGlobalErrorHandlers();
bootstrapTheme(ACTIVE_THEME_STORAGE_KEY, "dark");

// ── Service Worker lifecycle management ────────────────────────────────────
//
// Architecture contract:
//   • ONE unified SW, registered exclusively by VitePWA via the
//     virtual:pwa-register module below (scope "/", script "sw.js").
//   • registerType is "autoUpdate" in vite.config.ts and the Workbox SW is
//     generated (generateSW).  The push / notificationclick handlers live in
//     public/sw-push.js and are injected into that SW through
//     workbox.importScripts, so ONE worker owns scope "/" and handles both
//     precaching and push.
//   • pushNotifications.ts must use navigator.serviceWorker.ready (the
//     already-registered VitePWA SW) and NEVER register /sw-push.js itself.
//
// NEVER unregister service workers or unsubscribe push subscriptions here.
// Blind unregistration silently destroys PushSubscription objects and
// requires the user to re-grant Notification permission — browser policy
// prevents re-prompting in many cases, making the breakage permanent for that
// install.  A legacy sw-push.js registration at scope "/" needs no migration:
// the VitePWA SW registers at the same scope, replaces its script and the
// existing PushSubscription survives (it belongs to the registration).

// Only run SW management in production builds.  In dev, Vite's HMR handles
// module updates and there is no built SW file to manage.
if (import.meta.env.PROD) {
  window.addEventListener(
    "load",
    () => {
      // Register the unified VitePWA SW.
      // "virtual:pwa-register" only exists when VitePWA plugin runs (prod build).
      // Use @vite-ignore + variable to prevent dev-time resolution error.
      const pwaModule = "virtual:pwa-register";
      import(/* @vite-ignore */ pwaModule)
        .then(({ registerSW }) => {
          registerSW({
            /**
             * A new SW version is waiting to activate (state = "waiting").
             * We fire a DOM event instead of immediately calling skipWaiting,
             * so push subscriptions on the OLD SW remain intact until the
             * user deliberately accepts the update.
             *
             * UI contract: any component can listen for "pwa:update-available"
             * and call navigator.serviceWorker.controller?.postMessage({ type:
             * "SKIP_WAITING" }) followed by window.location.reload() when the
             * user clicks "Update now".
             *
             * The UpdateAvailable component in NotificationAndMisc.tsx must
             * listen to "pwa:update-available" (NOT "controllerchange") to
             * avoid firing on every internal SW swap.
             */
            onNeedRefresh() {
              window.dispatchEvent(new CustomEvent("pwa:update-available"));
            },

            onRegistered(reg) {
              if (reg) {
                logger.info("[PWA] SW registered — scope:", reg.scope);
              }
            },

            onRegisterError(error) {
              logger.error("[PWA] SW registration error:", error);
            },
          });
        })
        .catch((err) => {
          // virtual:pwa-register is only present when the VitePWA plugin is
          // active.  In edge cases (e.g. canary builds without the plugin)
          // this import may fail; swallow silently so the app still boots.
          logger.warn("[PWA] Could not import virtual:pwa-register:", err);
        });
    },
    { once: true }
  );
}

// ── React root ─────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <ProviderErrorBoundary providerName="Root">
    <ThemeProvider defaultTheme="dark" storageKey={ACTIVE_THEME_STORAGE_KEY}>
      <App />
    </ThemeProvider>
  </ProviderErrorBoundary>
);
