/**
 * Snapshots de sessão do Intelligence Hub: serializa o estado atual
 * (tab + filtros via URLSearchParams + entidade aberta) em base64 JSON
 * compactado e mantém histórico recente em localStorage.
 */
const STORAGE_KEY = 'intel-snapshots-v1';
const MAX_RECENT = 5;

export interface IntelSnapshotPayload {
  tab: string;
  params: Record<string, string>;
  entity?: { type: string; id: string; name: string } | null;
  ts: number;
}

export interface RecentSnapshot {
  id: string;
  label: string;
  hash: string;
  savedAt: number;
}

function safeBase64Encode(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return '';
  }
}

function safeBase64Decode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return '';
  }
}

export function encodeSnapshot(payload: IntelSnapshotPayload): string {
  return safeBase64Encode(JSON.stringify(payload));
}

export function decodeSnapshot(hash: string): IntelSnapshotPayload | null {
  const raw = safeBase64Decode(hash);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as IntelSnapshotPayload;
    if (typeof parsed.tab !== 'string' || typeof parsed.params !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readRecentSnapshots(): RecentSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSnapshot[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function pushRecentSnapshot(entry: Omit<RecentSnapshot, 'id' | 'savedAt'>): RecentSnapshot[] {
  const next: RecentSnapshot = {
    ...entry,
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    savedAt: Date.now(),
  };
  const list = [next, ...readRecentSnapshots()].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function buildShareUrl(hash: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('snap', hash);
  return url.toString();
}

export const SNAPSHOT_LIMIT = MAX_RECENT;
