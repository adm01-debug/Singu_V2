/**
 * Geração segura de secrets usando Web Crypto API.
 */

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*-_=+';
const CHARSET_ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Gera um secret criptograficamente seguro.
 * @param length Comprimento mínimo 32 caracteres
 * @param includeSpecial Incluir caracteres especiais (default: true)
 */
export function generateSecureSecret(length: number = 48, includeSpecial: boolean = true): string {
  const effectiveLength = Math.max(length, 32);
  const charset = includeSpecial ? CHARSET : CHARSET_ALPHANUM;
  const array = new Uint8Array(effectiveLength);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

/**
 * Gera um hash SHA-256 truncado para auditoria (não reversível).
 */
export async function hashForAudit(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 16); // Truncated for audit only
}

/** Calcula dias desde uma data */
export function daysSince(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Classificação de saúde do secret */
export type SecretHealthStatus = 'healthy' | 'warning' | 'critical';

export function getSecretHealth(daysSinceRotation: number): SecretHealthStatus {
  if (daysSinceRotation < 30) return 'healthy';
  if (daysSinceRotation < 90) return 'warning';
  return 'critical';
}
