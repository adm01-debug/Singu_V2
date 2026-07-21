import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ACTIVE_THEME_STORAGE_KEY, bootstrapTheme } from "@/components/theme/themeBootstrap";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
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
//   • registerType is "prompt" in vite.config.ts.  The waiting SW activates
//     ONLY when the user accepts the update banner, so active push
//     subscriptions are never silently destroyed mid-session.
//   • pushNotifications.ts must use navigator.serviceWorker.ready (the
//     already-registered VitePWA SW) instead of re-registering /sw-push.js.
//     Push event handlers are injected into the unified SW via the
//     injectManifest strategy (src/sw.ts imports both Workbox precaching and
//     the push / notificationclick handlers from sw-push.js).
//
// NEVER add navigator.serviceWorker.getRegistrations().then(forEach unregister)
// here without first capturing push subscriptions.  Blind unregistration
// silently destroys PushSubscription objects and requires the user to
// re-grant Notification permission — browser policy prevents re-prompting
// in many cases, making the breakage permanent for that install.

/**
 * One-time migration: remove any legacy /sw-push.js registration left over
 * from the previous dual-SW architecture.  The competing registration caused
 * Workbox to lose scope control on every push-subscribe call.
 *
 * Preservation strategy:
 *   1. Capture the active push endpoint before unsubscribing.
 *   2. Store it in sessionStorage under __legacy_push_endpoint.
 *   3. After the VitePWA unified SW activates (next load), pushNotifications.ts
 *      reads this key and re-registers the subscription via the new SW.
 */
async function migrateLegacyPushSW(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  let registrations: ReadonlyArray<ServiceWorkerRegistration>;
  try {
    registrations = await navigator.serviceWorker.getRegistrations();
  } catch {
    return;
  }

  for (const reg of registrations) {
    const scriptURL =
      reg.active?.scriptURL ??
      reg.installing?.scriptURL ??
      reg.waiting?.scriptURL ??
      "";

    // Only touch the legacy push-only SW — never the VitePWA Workbox SW.
    if (!scriptURL.includes("sw-push.js")) continue;

    try {
      const sub = await reg.pushManager?.getSubscription();
      if (sub) {
        // Persist endpoint so the app can resubscribe via the unified SW.
        sessionStorage.setItem("__legacy_push_endpoint", sub.endpoint);
        // Unsubscribe cleanly so the browser releases the VAPID association.
        await sub.unsubscribe();
      }
    } catch {
      /* Subscription already gone — still safe to unregister the SW. */
    }

    try {
      await reg.unregister();
      console.info(
        "[main] Migrated: removed legacy sw-push.js." +
          " Push notifications will reactivate after next login."
      );
    } catch (err) {
      console.warn("[main] Could not unregister legacy sw-push.js:", err);
    }
  }
}

// Only run SW management in production builds.  In dev, Vite's HMR handles
// module updates and there is no built SW file to manage.
if (import.meta.env.PROD) {
  window.addEventListener(
    "load",
    () => {
      // Step 1 — Clean up the competing legacy SW.  Must happen before VitePWA
      // registers its SW so the Workbox SW wins scope "/" cleanly.
      migrateLegacyPushSW();

      // Step 2 — Register the unified VitePWA SW.
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
                console.info("[PWA] SW registered — scope:", reg.scope);
              }
            },

            onRegisterError(error) {
              console.error("[PWA] SW registration error:", error);
            },
          });
        })
        .catch((err) => {
          // virtual:pwa-register is only present when the VitePWA plugin is
          // active.  In edge cases (e.g. canary builds without the plugin)
          // this import may fail; swallow silently so the app still boots.
          console.warn("[PWA] Could not import virtual:pwa-register:", err);
        });
    },
    { once: true }
  );
}

// ── React root ─────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey={ACTIVE_THEME_STORAGE_KEY}>
    <App />
  </ThemeProvider>
);
