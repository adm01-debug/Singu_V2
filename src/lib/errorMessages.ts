/**
 * Centralised API/database error sanitiser.
 *
 * Raw Supabase / Postgres errors expose internal details (table names, column
 * names, constraint names, RLS policy names). This module maps them to safe,
 * user-friendly Portuguese strings before they reach the UI layer.
 */

const POSTGRES_CODE_MAP: Record<string, string> = {
  '23505': 'Registro duplicado. Este item já existe.',
  '23503': 'Operação inválida: referência a registro inexistente.',
  '23502': 'Campo obrigatório não preenchido.',
  '23514': 'Valor inválido para este campo.',
  '22001': 'Texto excede o tamanho máximo permitido.',
  '22P02': 'Formato de dado inválido.',
  '42501': 'Permissão negada para esta operação.',
  '42P01': 'Recurso não encontrado.',
  'PGRST116': 'Nenhum registro encontrado.',
  'PGRST200': 'Relacionamento não encontrado.',
  'PGRST301': 'Acesso não autorizado.',
};

// Patterns that identify internal technical error messages that must not reach users.
const TECHNICAL_PATTERNS = [
  /violates.*constraint/i,
  /duplicate key/i,
  /foreign key/i,
  /null value in column/i,
  /row-level security/i,
  /permission denied for/i,
  /relation .+ does not exist/i,
  /column .+ does not exist/i,
  /syntax error at/i,
  /invalid input syntax for/i,
  /operator does not exist/i,
  /could not serialize/i,
  /deadlock detected/i,
  /pgrst\d+/i,
  /postgrest/i,
  /schema cache/i,
  /edge function error \[\d{3}\]:/i,
  /supabase\.co/i,
  /jwt/i,
  /table ".+" (of relation|doesn't)/i,
];

const DEFAULT_FALLBACK = 'Ocorreu um erro inesperado. Tente novamente.';

/**
 * Converts any thrown value into a safe, user-facing Portuguese error message.
 *
 * @param e     The value caught in a catch/onError handler.
 * @param fallback Override the generic fallback message.
 */
export function parseApiError(e: unknown, fallback = DEFAULT_FALLBACK): string {
  if (!e) return fallback;

  // Extract code and message from Supabase PostgrestError-like objects
  let code: string | undefined;
  let message = '';

  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.code === 'string') code = obj.code;
    if (typeof obj.message === 'string') message = obj.message;
  } else if (e instanceof Error) {
    message = e.message;
  } else if (typeof e === 'string') {
    message = e;
  }

  // Prefer mapped Postgres error codes
  if (code && POSTGRES_CODE_MAP[code]) return POSTGRES_CODE_MAP[code];

  if (!message) return fallback;

  // Always preserve our own explicit app-level errors (already in Portuguese)
  if (message === 'Não autenticado') return 'Sessão expirada. Faça login novamente.';
  if (message === 'Usuário não autenticado') return 'Sessão expirada. Faça login novamente.';

  // Network errors
  if (message === 'Failed to fetch' || message.startsWith('NetworkError')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // If the message matches any technical pattern, suppress it
  if (TECHNICAL_PATTERNS.some((p) => p.test(message))) return fallback;

  // If the message appears to be in Portuguese (starts with uppercase non-ASCII or common PT chars)
  // and doesn't look technical, surface it as-is
  if (/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]/.test(message) && message.length < 200) {
    return message;
  }

  return fallback;
}
