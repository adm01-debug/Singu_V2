/**
 * Utilitários para o painel de health-check do Intelligence Hub.
 */
export const INTEL_STORAGE_KEYS = [
  'intel-bookmarks-v1',
  'intel-saved-views-v1',
  'intel-density-v1',
  'intel-pres-v1',
  'intel-snapshots-v1',
  'intel-ask-history',
  'intel-graph-layout-v1',
] as const;

export const INTEL_NOTES_PREFIX = 'intel-notes-v1:';
export const INTEL_TELEMETRY_KEY = 'intel-telemetry-v1';

export interface IntelStorageStat {
  key: string;
  size: number;
  itemCount: number;
}

export function inspectIntelStorage(): IntelStorageStat[] {
  const stats: IntelStorageStat[] = [];

  INTEL_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        stats.push({ key, size: 0, itemCount: 0 });
        return;
      }
      let count = 0;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) count = parsed.length;
        else if (parsed && typeof parsed === 'object') count = Object.keys(parsed as Record<string, unknown>).length;
        else count = 1;
      } catch {
        count = 1;
      }
      stats.push({ key, size: raw.length, itemCount: count });
    } catch {
      stats.push({ key, size: 0, itemCount: 0 });
    }
  });

  // Notas (prefixadas)
  let notesCount = 0;
  let notesSize = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(INTEL_NOTES_PREFIX)) {
        notesCount += 1;
        notesSize += (localStorage.getItem(k) || '').length;
      }
    }
  } catch {
    /* ignore */
  }
  stats.push({ key: `${INTEL_NOTES_PREFIX}*`, size: notesSize, itemCount: notesCount });

  // Telemetria (sessionStorage)
  try {
    const raw = sessionStorage.getItem(INTEL_TELEMETRY_KEY);
    if (raw) {
      let count = 0;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) count = parsed.length;
      } catch {
        /* ignore */
      }
      stats.push({ key: INTEL_TELEMETRY_KEY + ' (session)', size: raw.length, itemCount: count });
    }
  } catch {
    /* ignore */
  }

  return stats;
}

export function resetIntelState(): number {
  let removed = 0;
  INTEL_STORAGE_KEYS.forEach((key) => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removed += 1;
      }
    } catch { /* ignore storage errors */ }
  });
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(INTEL_NOTES_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => {
      localStorage.removeItem(k);
      removed += 1;
    });
  } catch {
    /* ignore */
  }
  try {
    if (sessionStorage.getItem(INTEL_TELEMETRY_KEY)) {
      sessionStorage.removeItem(INTEL_TELEMETRY_KEY);
      removed += 1;
    }
  } catch {
    /* ignore */
  }
  return removed;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}
