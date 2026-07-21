/**
 * Safe wrappers for Web Storage APIs.
 * localStorage/sessionStorage throw in Safari private mode and when quota
 * is exceeded — these helpers swallow those errors and return null/undefined.
 */

function store(type: 'local' | 'session'): Storage | null {
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const safeLocal = {
  get(key: string): string | null {
    try { return store('local')?.getItem(key) ?? null; } catch { return null; }
  },
  set(key: string, value: string): void {
    try { store('local')?.setItem(key, value); } catch { /* quota or private mode */ }
  },
  remove(key: string): void {
    try { store('local')?.removeItem(key); } catch { /* noop */ }
  },
  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = store('local')?.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  setJSON(key: string, value: unknown): void {
    try { store('local')?.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  },
};

export const safeSession = {
  get(key: string): string | null {
    try { return store('session')?.getItem(key) ?? null; } catch { return null; }
  },
  set(key: string, value: string): void {
    try { store('session')?.setItem(key, value); } catch { /* noop */ }
  },
  remove(key: string): void {
    try { store('session')?.removeItem(key); } catch { /* noop */ }
  },
};
