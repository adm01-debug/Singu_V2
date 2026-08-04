/**
 * Tracing helper para edge functions.
 * Lê X-Trace-Id do request ou gera um novo, propaga em logs estruturados.
 */

const TRACE_HEADER = "x-trace-id";

export function extractTraceId(req: Request): string {
  const existing = req.headers.get(TRACE_HEADER);
  if (existing) return existing;
  return crypto.randomUUID();
}

export function tracedLogger(traceId: string, fn: string) {
  const base = { traceId, fn };
  return {
    info: (msg: string, data?: Record<string, unknown>) =>
      console.log(JSON.stringify({ level: "info", ...base, msg, ...data })),
    warn: (msg: string, data?: Record<string, unknown>) =>
      console.warn(JSON.stringify({ level: "warn", ...base, msg, ...data })),
    error: (msg: string, data?: Record<string, unknown>) =>
      console.error(JSON.stringify({ level: "error", ...base, msg, ...data })),
  };
}

/** Adiciona o header de trace na resposta para o cliente correlacionar. */
export function withTraceResponseHeader(
  headers: HeadersInit,
  traceId: string,
): HeadersInit {
  return { ...headers, [TRACE_HEADER]: traceId };
}
