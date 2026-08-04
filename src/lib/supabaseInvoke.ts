/**
 * supabaseInvoke — wrapper sobre `supabase.functions.invoke` que injeta
 * automaticamente o header `X-Trace-Id` para correlação distribuída.
 *
 * Uso:
 *   const { data, error } = await invokeWithTrace('ask-crm', { body: { question } });
 *
 * Reusa trace ID se fornecido, senão gera novo via `newTraceId()`.
 */
import { supabase } from "@/integrations/supabase/client";
import { newTraceId, TRACE_HEADER_NAME } from "@/lib/requestId";
import { logger } from "@/lib/logger";

export interface InvokeWithTraceOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  traceId?: string;
}

export interface InvokeResult<T> {
  data: T | null;
  error: Error | null;
  traceId: string;
}

export async function invokeWithTrace<T = unknown>(
  fnName: string,
  options: InvokeWithTraceOptions = {},
): Promise<InvokeResult<T>> {
  const traceId = options.traceId || newTraceId();
  const headers = {
    ...(options.headers || {}),
    [TRACE_HEADER_NAME]: traceId,
  };

  try {
    const { data, error } = await supabase.functions.invoke(fnName, {
      body: options.body,
      headers,
    });

    if (error) {
      logger.error(`[invokeWithTrace] ${fnName} failed`, { traceId, error: error.message });
      return { data: null, error: error as Error, traceId };
    }

    return { data: (data as T) ?? null, error: null, traceId };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`[invokeWithTrace] ${fnName} threw`, { traceId, error: error.message });
    return { data: null, error, traceId };
  }
}
