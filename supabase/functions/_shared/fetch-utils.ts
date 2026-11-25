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
  [url, opts] = routeToOpenRouter(url, opts);
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

/** Provedor de IA: o gateway do Lovable (só existe no Lovable Cloud) foi trocado pelo OpenRouter.
 *  Chamadas ao endereço antigo seguem para o OpenRouter (compatível com OpenAI) com o modelo
 *  OPENROUTER_MODEL (padrão google/gemini-2.5-flash); a chave segue em DEEPSEEK_API_KEY
 *  (nome legado, lido por cada função antes de chamar fetchAI). */
export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LOVABLE_AI_URLS = new Set([
  'https://ai.gateway.lovable.dev/v1/chat/completions',
  'https://api.lovable.dev/v1/chat/completions',
]);

/** Lê env sem depender de `--allow-env` (no runtime das Edge Functions a leitura é liberada);
 *  sem isso a negativa de permissão viraria `catch` e o corpo seguiria com o modelo antigo. */
export function envValue(name: string): string | undefined {
  try {
    return Deno.env.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Chave usada nas chamadas ao OpenRouter. As funções legadas montam
 *  `Authorization: Bearer <DEEPSEEK_API_KEY>` antes de chamar `fetchAI`; ao reescrever a URL é
 *  preciso trocar a chave junto, senão o OpenRouter responde 401. O fallback mantém o
 *  comportamento anterior enquanto `OPENROUTER_API_KEY` não estiver configurada. */
export function openRouterKey(): string | undefined {
  return envValue('OPENROUTER_API_KEY') ?? envValue('DEEPSEEK_API_KEY');
}

/** Reescreve o `Authorization` das chamadas de IA para a chave do OpenRouter.
 *  Sem header `Authorization` o init segue intacto — quem não autentica não ganha chave.
 *  A chave entra por parâmetro para o contrato ficar testável sem `--allow-env`. */
export function applyOpenRouterAuth(opts: RequestInit, key: string | undefined): RequestInit {
  if (!key) return opts;
  const headers = new Headers(opts.headers as HeadersInit | undefined);
  if (!headers.has('authorization')) return opts;
  headers.set('Authorization', `Bearer ${key}`);
  return { ...opts, headers };
}

export function routeToOpenRouter(url: FetchTarget, opts: RequestInit): [FetchTarget, RequestInit] {
  if (typeof url !== 'string' || !LOVABLE_AI_URLS.has(url)) return [url, opts];
  const model = envValue('OPENROUTER_MODEL') ?? 'google/gemini-2.5-flash';
  let body = opts.body;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      parsed.model = model;
      body = JSON.stringify(parsed);
    } catch {
      // corpo não-JSON: envia como veio
    }
  }
  const routed = applyOpenRouterAuth(opts, openRouterKey());
  return [OPENROUTER_CHAT_URL, { ...routed, body }];
}

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
