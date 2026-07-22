import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export interface SavedView<T = unknown> {
  id: string;
  name: string;
  scope: string;
  state: T;
  isDefault?: boolean;
  isFavorite?: boolean;
  createdAt: string;
}

const PREFIX = 'singu-views-';

function readAll<T>(scope: string, userId?: string): SavedView<T>[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${PREFIX}${userId}-${scope}-v1` : `${PREFIX}${scope}-v1`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedView<T>[]) : [];
  } catch {
    return [];
  }
}

function writeAll<T>(scope: string, views: SavedView<T>[], userId?: string) {
  try {
    const key = userId ? `${PREFIX}${userId}-${scope}-v1` : `${PREFIX}${scope}-v1`;
    window.localStorage.setItem(key, JSON.stringify(views));
  } catch { /* noop */ }
}

function encodeState<T>(state: T): string {
  try {
    const json = JSON.stringify(state);
    return typeof window === 'undefined' ? json : window.btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

function decodeState<T>(encoded: string): T | null {
  try {
    const json = decodeURIComponent(escape(window.atob(encoded)));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Hook universal de "Saved Views" para listas (Contatos, Empresas, Pipeline).
 * - Persiste no localStorage por escopo
 * - Sincroniza ?view= na URL para compartilhar
 * - Suporta view padrão (auto-load) e favoritos
 *
 * Não chama endpoint, sem `useEffect` para fetch — apenas lê/escreve estado client-side.
 */
export function useSavedViews<T>(scope: string) {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [views, setViews] = useState<SavedView<T>[]>(() => readAll<T>(scope, user?.id));

  const persist = useCallback((next: SavedView<T>[]) => {
    setViews(next);
    writeAll(scope, next, user?.id);
  }, [scope, user?.id]);

  const save = useCallback(
    (name: string, state: T) => {
      const next: SavedView<T> = {
        // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
        id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        scope,
        state,
        createdAt: new Date().toISOString(),
      };
      persist([next, ...views]);
      return next;
    },
    [persist, views, scope],
  );

  const remove = useCallback(
    (id: string) => persist(views.filter((v) => v.id !== id)),
    [persist, views],
  );

  const setDefault = useCallback(
    (id: string) => persist(views.map((v) => ({ ...v, isDefault: v.id === id }))),
    [persist, views],
  );

  const toggleFavorite = useCallback(
    (id: string) => persist(views.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v))),
    [persist, views],
  );

  const apply = useCallback(
    (view: SavedView<T>) => {
      const encoded = encodeState(view.state);
      if (encoded) {
        params.set('savedView', encoded);
        setParams(params, { replace: true });
      }
      return view.state;
    },
    [params, setParams],
  );

  const shareUrl = useCallback(
    (view: SavedView<T>) => {
      const encoded = encodeState(view.state);
      if (typeof window === 'undefined') return '';
      const url = new URL(window.location.href);
      url.searchParams.set('savedView', encoded);
      return url.toString();
    },
    [],
  );

  const fromUrl = useMemo<T | null>(() => {
    const v = params.get('savedView');
    if (!v) return null;
    return decodeState<T>(v);
  }, [params]);

  const defaultView = useMemo(() => views.find((v) => v.isDefault) ?? null, [views]);

  return { views, save, remove, setDefault, toggleFavorite, apply, shareUrl, fromUrl, defaultView };
}
