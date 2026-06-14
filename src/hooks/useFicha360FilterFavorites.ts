import { useCallback, useEffect, useState } from 'react';
import { sanitizeTags as sanitizeTagsLib, type InteractionTag } from '@/lib/interactionTags';

const STORAGE_KEY = 'ficha360-filter-favorites-v1';
const MAX_FAVORITES = 10;
const VALID_DAYS = [7, 30, 90, 365] as const;
const VALID_CHANNELS = ['whatsapp', 'call', 'email', 'meeting', 'note'] as const;
const MAX_DESCRIPTION = 200;
const MAX_QUERY = 80;

export interface FilterFavorite {
  id: string;
  name: string;
  description?: string;
  days: number;
  channels: string[];
  tags: InteractionTag[];
  q?: string;
  autoOpenSummary?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface SharedFavoritePayload {
  name: string;
  description?: string;
  days: number;
  channels: string[];
  tags?: InteractionTag[];
  q?: string;
  autoOpenSummary?: boolean;
}

function isValidDays(d: unknown): d is number {
  return typeof d === 'number' && (VALID_DAYS as readonly number[]).includes(d);
}

function sanitizeChannels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(VALID_CHANNELS);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    if (typeof c !== 'string') continue;
    const norm = c.trim().toLowerCase();
    if (!allowed.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out.sort();
}

function sanitizeName(raw: unknown, fallback = 'Favorito'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().slice(0, 40);
  return trimmed || fallback;
}

function sanitizeDescription(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, MAX_DESCRIPTION);
  return trimmed || undefined;
}

function sanitizeQuery(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, MAX_QUERY);
  return trimmed || undefined;
}

function normalizeQ(q: string | undefined | null): string {
  return (q ?? '').trim();
}

function readAll(): FilterFavorite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: FilterFavorite[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      if (typeof r.id !== 'string' || !isValidDays(r.days)) continue;
      const createdAt = typeof r.createdAt === 'number' ? r.createdAt : Date.now();
      out.push({
        id: r.id,
        name: sanitizeName(r.name),
        description: sanitizeDescription(r.description),
        days: r.days,
        channels: sanitizeChannels(r.channels),
        tags: sanitizeTagsLib(r.tags),
        q: sanitizeQuery(r.q),
        autoOpenSummary:
          typeof r.autoOpenSummary === 'boolean' ? r.autoOpenSummary : true,
        createdAt,
        updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeAll(items: FilterFavorite[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  return `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameCombo(
  a: FilterFavorite,
  days: number,
  channels: string[],
  tags: InteractionTag[] = [],
  q: string | undefined = undefined,
): boolean {
  if (a.days !== days) return false;
  if (a.channels.length !== channels.length) return false;
  for (let i = 0; i < a.channels.length; i++) {
    if (a.channels[i] !== channels[i]) return false;
  }
  const aTags = (a.tags ?? []).slice().sort();
  const bTags = tags.slice().sort();
  if (aTags.length !== bTags.length) return false;
  for (let i = 0; i < aTags.length; i++) {
    if (aTags[i] !== bTags[i]) return false;
  }
  if (normalizeQ(a.q) !== normalizeQ(q)) return false;
  return true;
}

function dedupeName(name: string, used: Set<string>): string {
  if (!used.has(name)) return name;
  let i = 2;
  while (used.has(`${name} (${i})`)) i++;
  return `${name} (${i})`;
}

// ── Codificação para link compartilhado (base64url) ──

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeFavoriteToToken(payload: SharedFavoritePayload): string {
  const description = sanitizeDescription(payload.description);
  const q = sanitizeQuery(payload.q);
  const safe = {
    v: 2,
    name: sanitizeName(payload.name),
    days: isValidDays(payload.days) ? payload.days : 90,
    channels: sanitizeChannels(payload.channels),
    tags: sanitizeTagsLib(payload.tags),
    ...(description ? { description } : {}),
    ...(q ? { q } : {}),
    ...(typeof payload.autoOpenSummary === 'boolean'
      ? { autoOpenSummary: payload.autoOpenSummary }
      : {}),
  };
  return utf8ToBase64Url(JSON.stringify(safe));
}

export function decodeFavoriteFromToken(token: string): SharedFavoritePayload | null {
  try {
    const json = base64UrlToUtf8(token);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const r = parsed as Record<string, unknown>;
    if (r.v !== 1 && r.v !== 2) return null;
    if (!isValidDays(r.days)) return null;
    return {
      name: sanitizeName(r.name),
      description: sanitizeDescription(r.description),
      days: r.days,
      channels: sanitizeChannels(r.channels),
      tags: sanitizeTagsLib(r.tags),
      q: sanitizeQuery(r.q),
      autoOpenSummary:
        typeof r.autoOpenSummary === 'boolean' ? r.autoOpenSummary : true,
    };
  } catch {
    return null;
  }
}

/**
 * Constrói a URL compartilhável preservando a rota atual e adicionando
 * `?favorito=<token>`. Remove `q` (busca textual é contextual e não vai junto).
 */
export function buildFavoriteShareUrl(token: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('favorito', token);
  url.searchParams.delete('q');
  return url.toString();
}

/**
 * Hook que gerencia favoritos de filtros (período + canais + tags + busca + descrição)
 * em localStorage, com sincronização entre abas via evento `storage`.
 */
export function useFicha360FilterFavorites() {
  const [favorites, setFavorites] = useState<FilterFavorite[]>(() => readAll());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(readAll());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: FilterFavorite[]) => {
    setFavorites(next);
    writeAll(next);
  }, []);

  const findMatch = useCallback(
    (
      days: number,
      channels: string[],
      tags: InteractionTag[] = [],
      q: string | undefined = undefined,
    ): FilterFavorite | null => {
      const sorted = sanitizeChannels(channels);
      const cleanTags = sanitizeTagsLib(tags);
      const cleanQ = sanitizeQuery(q);
      return favorites.find((f) => sameCombo(f, days, sorted, cleanTags, cleanQ)) ?? null;
    },
    [favorites],
  );

  const save = useCallback(
    (
      name: string,
      days: number,
      channels: string[],
      tags: InteractionTag[] = [],
      q?: string,
      description?: string,
      autoOpenSummary: boolean = true,
    ): FilterFavorite | null => {
      if (!isValidDays(days)) return null;
      const cleanName = sanitizeName(name, '');
      if (!cleanName) return null;
      const cleanChannels = sanitizeChannels(channels);
      const cleanTags = sanitizeTagsLib(tags);
      const cleanQ = sanitizeQuery(q);
      const existing = favorites.find((f) => sameCombo(f, days, cleanChannels, cleanTags, cleanQ));
      if (existing) return existing;
      if (favorites.length >= MAX_FAVORITES) return null;
      const used = new Set(favorites.map((f) => f.name));
      const finalName = dedupeName(cleanName, used);
      const next: FilterFavorite = {
        id: genId(),
        name: finalName,
        description: sanitizeDescription(description),
        days,
        channels: cleanChannels,
        tags: cleanTags,
        q: cleanQ,
        autoOpenSummary,
        createdAt: Date.now(),
      };
      persist([next, ...favorites]);
      return next;
    },
    [favorites, persist],
  );

  const remove = useCallback(
    (id: string) => persist(favorites.filter((f) => f.id !== id)),
    [favorites, persist],
  );

  /**
   * Salva o conjunto atual sem prompt, usando nome auto-gerado.
   * Se já existir match exato, devolve-o em vez de duplicar.
   */
  const quickSave = useCallback(
    (
      days: number,
      channels: string[],
      tags: InteractionTag[] = [],
      q?: string,
    ): FilterFavorite | null => {
      if (!isValidDays(days)) return null;
      const cleanChannels = sanitizeChannels(channels);
      const cleanTags = sanitizeTagsLib(tags);
      const cleanQ = sanitizeQuery(q);
      const existing = favorites.find((f) => sameCombo(f, days, cleanChannels, cleanTags, cleanQ));
      if (existing) return existing;
      if (favorites.length >= MAX_FAVORITES) return null;
      const used = new Set(favorites.map((f) => f.name));
      const finalName = dedupeName(suggestFavoriteName(days, cleanChannels, cleanTags, cleanQ), used);
      const next: FilterFavorite = {
        id: genId(),
        name: finalName,
        days,
        channels: cleanChannels,
        tags: cleanTags,
        q: cleanQ,
        autoOpenSummary: true,
        createdAt: Date.now(),
      };
      persist([next, ...favorites]);
      return next;
    },
    [favorites, persist],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const cleanName = sanitizeName(name, '');
      if (!cleanName) return;
      persist(
        favorites.map((f) =>
          f.id === id ? { ...f, name: cleanName, updatedAt: Date.now() } : f,
        ),
      );
    },
    [favorites, persist],
  );

  /**
   * Atualiza nome, descrição e/ou flag autoOpenSummary de um preset existente.
   * Em conflito de nome com outro preset, faz dedup com sufixo " (n)".
   */
  const update = useCallback(
    (
      id: string,
      patch: Partial<Pick<FilterFavorite, 'name' | 'description' | 'autoOpenSummary'>>,
    ): FilterFavorite | null => {
      const target = favorites.find((f) => f.id === id);
      if (!target) return null;
      let nextName = target.name;
      if (typeof patch.name === 'string') {
        const cleaned = sanitizeName(patch.name, '');
        if (!cleaned) return null;
        if (cleaned !== target.name) {
          const used = new Set(favorites.filter((f) => f.id !== id).map((f) => f.name));
          nextName = dedupeName(cleaned, used);
        }
      }
      const updated: FilterFavorite = {
        ...target,
        name: nextName,
        description:
          'description' in patch ? sanitizeDescription(patch.description) : target.description,
        autoOpenSummary:
          typeof patch.autoOpenSummary === 'boolean'
            ? patch.autoOpenSummary
            : target.autoOpenSummary,
        updatedAt: Date.now(),
      };
      persist(favorites.map((f) => (f.id === id ? updated : f)));
      return updated;
    },
    [favorites, persist],
  );

  /**
   * Atualiza os filtros capturados (days/channels/tags/q) de um preset existente.
   * Mantém nome/descrição/flag.
   */
  const updateFilters = useCallback(
    (
      id: string,
      days: number,
      channels: string[],
      tags: InteractionTag[] = [],
      q?: string,
    ): FilterFavorite | null => {
      if (!isValidDays(days)) return null;
      const target = favorites.find((f) => f.id === id);
      if (!target) return null;
      const updated: FilterFavorite = {
        ...target,
        days,
        channels: sanitizeChannels(channels),
        tags: sanitizeTagsLib(tags),
        q: sanitizeQuery(q),
        updatedAt: Date.now(),
      };
      persist(favorites.map((f) => (f.id === id ? updated : f)));
      return updated;
    },
    [favorites, persist],
  );

  /**
   * Importa um favorito recebido via link, evitando duplicatas.
   * Se já existe combinação igual, devolve a existente sem criar nova.
   */
  const importShared = useCallback(
    (payload: SharedFavoritePayload): FilterFavorite | null => {
      const cleanChannels = sanitizeChannels(payload.channels);
      const cleanTags = sanitizeTagsLib(payload.tags);
      const cleanQ = sanitizeQuery(payload.q);
      const existing = favorites.find((f) =>
        sameCombo(f, payload.days, cleanChannels, cleanTags, cleanQ),
      );
      if (existing) return existing;
      if (favorites.length >= MAX_FAVORITES) return null;
      const used = new Set(favorites.map((f) => f.name));
      const finalName = dedupeName(sanitizeName(payload.name), used);
      const next: FilterFavorite = {
        id: genId(),
        name: finalName,
        description: sanitizeDescription(payload.description),
        days: payload.days,
        channels: cleanChannels,
        tags: cleanTags,
        q: cleanQ,
        autoOpenSummary:
          typeof payload.autoOpenSummary === 'boolean' ? payload.autoOpenSummary : true,
        createdAt: Date.now(),
      };
      persist([next, ...favorites]);
      return next;
    },
    [favorites, persist],
  );

  return {
    favorites,
    save,
    quickSave,
    remove,
    rename,
    update,
    updateFilters,
    findMatch,
    importShared,
    canSaveMore: favorites.length < MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES,
  };
}

export function suggestFavoriteName(
  days: number,
  channels: string[],
  tags: InteractionTag[] = [],
  q?: string,
): string {
  const periodLabel =
    days === 7 ? '7d' : days === 30 ? '30d' : days === 365 ? '1a' : '90d';
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    call: 'Ligação',
    email: 'Email',
    meeting: 'Reunião',
    note: 'Nota',
  };
  const sorted = sanitizeChannels(channels);
  let chPart = '';
  if (sorted.length === 0) chPart = 'Todos';
  else if (sorted.length === 1) chPart = labels[sorted[0]] ?? sorted[0];
  else if (sorted.length === 2) chPart = sorted.map((c) => labels[c] ?? c).join('+');
  else chPart = `${sorted.length} canais`;
  const cleanTags = sanitizeTagsLib(tags);
  const tagSuffix =
    cleanTags.length > 0
      ? ` · ${cleanTags.length} tag${cleanTags.length === 1 ? '' : 's'}`
      : '';
  const cleanQ = (q ?? '').trim();
  const qSuffix = cleanQ ? ` · "${cleanQ.slice(0, 12)}"` : '';
  return `${periodLabel} · ${chPart}${tagSuffix}${qSuffix}`.slice(0, 40);
}
