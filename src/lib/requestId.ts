/**
 * Distributed tracing — geração e propagação de X-Trace-Id.
 * Usado para correlacionar logs entre frontend e edge functions.
 */

const TRACE_HEADER = "x-trace-id";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return `trace_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Gera um novo trace ID (UUID v4 quando disponível). */
export function newTraceId(): string {
  return uuid();
}

/** Header padrão para propagação. */
export const TRACE_HEADER_NAME = TRACE_HEADER;

/**
 * Wrapper para enriquecer headers de fetch/invoke com trace ID.
 * Reusa trace existente se fornecido, senão gera novo.
 */
export function withTraceHeaders(
  headers: Record<string, string> = {},
  traceId?: string,
): Record<string, string> {
  return {
    ...headers,
    [TRACE_HEADER]: traceId || newTraceId(),
  };
}
