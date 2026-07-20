/**
 * Shared fetch helpers for Supabase edge functions.
 *
 * Deno isolates have a hard 60-second wall-clock limit per invocation, but a
 * stalled fetch() still blocks the event loop and consumes a concurrency slot
 * for the full duration — starving other requests. Always pass a deadline.
 *
 * Recommended timeouts by call type:
 *   AI gateway / LLM inference  → AI_TIMEOUT_MS   (45 s)
 *   External scraping APIs      → SCRAPE_TIMEOUT_MS (90 s)
 *   Third-party REST APIs       → API_TIMEOUT_MS  (30 s)
 *   Internal health probes      → HEALTH_TIMEOUT_MS (10 s)
 */

export const AI_TIMEOUT_MS = 45_000;
export const SCRAPE_TIMEOUT_MS = 90_000;
export const API_TIMEOUT_MS = 30_000;
export const HEALTH_TIMEOUT_MS = 10_000;

/**
 * fetch() with a hard deadline via AbortSignal.timeout().
 * Throws a DOMException named "TimeoutError" if the request exceeds timeoutMs.
 *
 * @param url     Request URL or Request object
 * @param opts    RequestInit options (signal is overridden)
 * @param timeoutMs Deadline in milliseconds (default: API_TIMEOUT_MS = 30 s)
 */
export function fetchWithTimeout(
  url: string | URL | Request,
  opts: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
}

/** Convenience wrapper for AI gateway / LLM inference calls (45 s deadline). */
export function fetchAI(
  url: string | URL | Request,
  opts: RequestInit = {},
): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(AI_TIMEOUT_MS) });
}

/** Convenience wrapper for external scraping API calls (90 s deadline). */
export function fetchScrape(
  url: string | URL | Request,
  opts: RequestInit = {},
): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS) });
}

/** Convenience wrapper for third-party REST API calls (30 s deadline). */
export function fetchAPI(
  url: string | URL | Request,
  opts: RequestInit = {},
): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
}
