// Shared helper for edge functions to record Lovable AI Gateway calls
// into public.ai_gateway_metrics. Best-effort — never throws.
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

export type AiGatewayStatus = 'success' | 'error' | 'rate_limited' | 'timeout';

export interface LogAiGatewayCallInput {
  functionName: string;
  model?: string;
  status: AiGatewayStatus;
  httpStatus?: number;
  durationMs: number;
  tokensIn?: number;
  tokensOut?: number;
  errorCode?: string;
  errorMessage?: string;
  userId?: string | null;
}

export async function logAiGatewayCall(input: LogAiGatewayCallInput): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const admin = createClient(url, key, { auth: { persistSession: false } });
    await admin.from('ai_gateway_metrics').insert({
      function_name: input.functionName,
      model: input.model ?? null,
      status: input.status,
      http_status: input.httpStatus ?? null,
      duration_ms: Math.max(0, Math.round(input.durationMs)),
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ? input.errorMessage.slice(0, 500) : null,
      user_id: input.userId ?? null,
    });
  } catch (_) {
    // swallow — telemetry must never break the caller
  }
}

/** Wrap a fetch to the Lovable AI Gateway with automatic latency + status logging. */
export async function withAiGatewayMetrics<T>(
  meta: { functionName: string; model?: string; userId?: string | null },
  fn: () => Promise<{ result: T; httpStatus?: number; tokensIn?: number; tokensOut?: number }>,
): Promise<T> {
  const started = performance.now();
  try {
    const { result, httpStatus, tokensIn, tokensOut } = await fn();
    const status: AiGatewayStatus =
      httpStatus === 429 ? 'rate_limited' : httpStatus && httpStatus >= 400 ? 'error' : 'success';
    await logAiGatewayCall({
      ...meta,
      status,
      httpStatus,
      durationMs: performance.now() - started,
      tokensIn,
      tokensOut,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status: AiGatewayStatus = /timeout/i.test(message) ? 'timeout' : 'error';
    await logAiGatewayCall({
      ...meta,
      status,
      durationMs: performance.now() - started,
      errorMessage: message,
    });
    throw err;
  }
}