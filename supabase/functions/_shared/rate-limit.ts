/**
 * In-memory rate limiter for Edge Functions (Deno).
 *
 * Uses a sliding-window counter per key (typically IP or user ID).
 * State lives in the isolate's memory — resets on cold start, which is
 * acceptable for edge-level rate limiting (DB-backed limiting is overkill
 * for most CRM workloads).
 *
 * Usage in an edge function:
 *   import { rateLimit } from "../_shared/rate-limit.ts";
 *
 *   const limiter = rateLimit({ windowMs: 60_000, max: 30 });
 *
 *   Deno.serve(async (req) => {
 *     const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
 *     const limited = limiter.check(ip);
 *     if (limited) return limited;   // 429 response
 *     // … normal handler
 *   });
 */

import { corsHeaders, scopedCorsHeaders } from "./auth.ts";

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60 000 = 1 min) */
  windowMs?: number;
  /** Max requests per window (default: 30) */
  max?: number;
  /** Response message on 429 (default: "Too many requests") */
  message?: string;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 30;
  const message = options.message ?? "Too many requests. Please try again later.";

  const store = new Map<string, WindowEntry>();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  let lastCleanup = Date.now();
  const CLEANUP_INTERVAL = 5 * 60_000;

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }

  return {
    /**
     * Check if a key has exceeded the rate limit.
     * Returns a 429 Response if limited, or null if allowed.
     * Pass `req` to use scoped (origin-specific) CORS headers on the 429 response.
     */
    check(key: string, req?: Request): Response | null {
      cleanup();

      const now = Date.now();
      let entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
        store.set(key, entry);
        return null;
      }

      entry.count++;

      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        const baseHeaders = req ? scopedCorsHeaders(req) : corsHeaders;
        return new Response(
          JSON.stringify({ error: message }),
          {
            status: 429,
            headers: {
              ...baseHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(max),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
            },
          },
        );
      }

      return null;
    },

    /** Get remaining requests for a key */
    remaining(key: string): number {
      const entry = store.get(key);
      if (!entry || Date.now() >= entry.resetAt) return max;
      return Math.max(0, max - entry.count);
    },
  };
}
