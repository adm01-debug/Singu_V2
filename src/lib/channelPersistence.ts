import {
  CHANNEL_PERSISTENCE_KEY as KEY,
  CHANNEL_PERSISTENCE_TTL_MS as TTL_MS,
  CHANNEL_PERSISTENCE_VALID_VALUES,
} from '@/config/channelPersistence.config';

const VALID = new Set<string>(CHANNEL_PERSISTENCE_VALID_VALUES);

interface Stored {
  canais: string[];
  ts: number;
}

function scopedKey(userId?: string): string {
  return userId ? `${KEY}-${userId}` : KEY;
}

export function readAppliedCanais(userId?: string): string[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const key = scopedKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || !Array.isArray(parsed.canais) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    const filtered = parsed.canais.filter((v) => typeof v === 'string' && VALID.has(v));
    return filtered.length > 0 ? filtered : null;
  } catch {
    return null;
  }
}

export function writeAppliedCanais(canais: string[], userId?: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = scopedKey(userId);
    if (!Array.isArray(canais) || canais.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    const filtered = canais.filter((v) => typeof v === 'string' && VALID.has(v));
    if (filtered.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ canais: filtered, ts: Date.now() } satisfies Stored));
  } catch {
    /* noop */
  }
}

export function clearAppliedCanais(userId?: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(scopedKey(userId));
  } catch {
    /* noop */
  }
}
