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
type FetchTarget = string | URL | Request;

export function fetchWithTimeout(
  url: FetchTarget,
  opts: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
}

/** Convenience wrapper for AI gateway / LLM inference calls (45 s deadline).
 *  Automatically logs latency, status, model and token usage into
 *  `public.ai_gateway_metrics` (best-effort, never throws). Callers may pass a
 *  `functionName` via the 3rd arg to override the auto-detected name. */
export async function fetchAI(
  url: FetchTarget,
  opts: RequestInit = {},
  meta: { functionName?: string } = {},
): Promise<Response> {
  const started = performance.now();
  const functionName = meta.functionName ?? detectFunctionName();
  const model = extractModelFromInit(opts);
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(AI_TIMEOUT_MS) });
    // Peek response body without consuming it for the caller.
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;
    let errorMessage: string | undefined;
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      if (text) {
        const parsed = JSON.parse(text);
        tokensIn = parsed?.usage?.prompt_tokens;
        tokensOut = parsed?.usage?.completion_tokens;
        if (!res.ok) errorMessage = parsed?.error?.message ?? text.slice(0, 500);
      }
    } catch {
      // non-JSON or streaming body — skip token extraction
    }
    const status =
      res.status === 429 ? 'rate_limited' : res.ok ? 'success' : 'error';
    void logAiGatewayCallSafe({
      function_name: functionName,
      model,
      status,
      http_status: res.status,
      duration_ms: Math.round(performance.now() - started),
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      error_message: errorMessage,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    void logAiGatewayCallSafe({
      function_name: functionName,
      model,
      status: isTimeout ? 'timeout' : 'error',
      duration_ms: Math.round(performance.now() - started),
      error_message: message,
    });
    throw err;
  }
}

// ---------- internal helpers ----------

function detectFunctionName(): string {
  try {
    // Deno edge runtime path: /home/deno/functions/<name>/index.ts
    const stack = new Error().stack ?? '';
    const match = stack.match(/functions[\\/]([\w-]+)[\\/]/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return 'unknown';
}

function extractModelFromInit(opts: RequestInit): string | undefined {
  try {
    if (typeof opts.body === 'string') {
      const parsed = JSON.parse(opts.body);
      if (typeof parsed?.model === 'string') return parsed.model;
    }
  } catch {
    // ignore
  }
  return undefined;
}

interface AiGatewayMetricInsert {
  function_name: string;
  model?: string;
  status: 'success' | 'error' | 'rate_limited' | 'timeout';
  http_status?: number;
  duration_ms: number;
  tokens_in?: number;
  tokens_out?: number;
  error_message?: string;
}

async function logAiGatewayCallSafe(row: AiGatewayMetricInsert): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    await fetch(`${url}/rest/v1/ai_gateway_metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        function_name: row.function_name,
        model: row.model ?? null,
        status: row.status,
        http_status: row.http_status ?? null,
        duration_ms: Math.max(0, row.duration_ms),
        tokens_in: row.tokens_in ?? null,
        tokens_out: row.tokens_out ?? null,
        error_message: row.error_message ? row.error_message.slice(0, 500) : null,
      }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // telemetry must never break the caller
  }
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
