import { createContext, useContext, useCallback, useRef, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type NavigationDirection = 'forward' | 'back' | 'replace';

interface NavigationEntry {
  path: string;
  key: string;
  index: number | null;
}

interface NavigationSnapshot {
  version: 2;
  owner: string | null;
  entries: NavigationEntry[];
  position: number;
}

interface NavigationStackContextType {
  goBack: (fallback?: string) => void;
  goToIndex: (index: number) => void;
  previousPath: string | null;
  direction: NavigationDirection;
  stack: string[];
}

const NavigationStackContext = createContext<NavigationStackContextType | null>(null);
const MAX_STACK_SIZE = 20;
const STORAGE_KEY = 'singu_nav_stack';

export function safeNavigationPath(path: string): string | null {
  const hasControlCharacter = Array.from(path).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
  if (path.length > 2048 || !path.startsWith('/') || path.startsWith('//')
    || path.includes('\\') || hasControlCharacter) return null;
  try {
    return new URL(path, window.location.origin).origin === window.location.origin ? path : null;
  } catch {
    return null;
  }
}

function browserIndex(): number | null {
  const state: unknown = window.history.state;
  if (state && typeof state === 'object' && 'idx' in state
    && typeof state.idx === 'number' && Number.isSafeInteger(state.idx) && state.idx >= 0) {
    return state.idx;
  }
  return null;
}

function currentEntry(location: { pathname: string; search: string; hash: string; key: string }): NavigationEntry {
  return { path: location.pathname + location.search + location.hash, key: location.key, index: browserIndex() };
}

function freshSnapshot(owner: string | null, entry: NavigationEntry): NavigationSnapshot {
  return { version: 2, owner, entries: [entry], position: 0 };
}

function loadSnapshot(owner: string | null, entry: NavigationEntry): NavigationSnapshot {
  if (!owner) return freshSnapshot(owner, entry);
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object' || !('version' in stored) || stored.version !== 2
      || !('owner' in stored) || stored.owner !== owner || !('entries' in stored)
      || !Array.isArray(stored.entries) || stored.entries.length < 1
      || stored.entries.length > MAX_STACK_SIZE || !('position' in stored)
      || typeof stored.position !== 'number' || !Number.isInteger(stored.position)
      || stored.position < 0 || stored.position >= stored.entries.length) return freshSnapshot(owner, entry);

    const entries: unknown[] = stored.entries;
    if (!entries.every((item): item is NavigationEntry => item !== null && typeof item === 'object'
      && 'path' in item && typeof item.path === 'string' && safeNavigationPath(item.path) !== null
      && 'key' in item && typeof item.key === 'string' && item.key.length <= 100
      && 'index' in item && (item.index === null || typeof item.index === 'number'
        && Number.isSafeInteger(item.index) && item.index >= 0))) return freshSnapshot(owner, entry);

    const position = stored.position;
    const active = entries[position];
    if (active.key !== entry.key || active.path !== entry.path || active.index !== entry.index) {
      return freshSnapshot(owner, entry);
    }
    return { version: 2, owner, entries, position };
  } catch {
    return freshSnapshot(owner, entry);
  }
}

function saveSnapshot(snapshot: NavigationSnapshot) {
  try {
    if (snapshot.owner) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage pode estar indisponível no navegador.
  }
}

export function NavigationStackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { user, loading } = useAuth();
  const owner = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<NavigationSnapshot>(() => loadSnapshot(owner, currentEntry(location)));
  const snapshotRef = useRef(snapshot);
  const [direction, setDirection] = useState<NavigationDirection>('forward');

  useEffect(() => {
    if (loading) return;
    const entry = currentEntry(location);
    let next = snapshotRef.current;
    let nextDirection: NavigationDirection = 'forward';

    if (next.owner !== owner) {
      next = loadSnapshot(owner, entry);
    } else if (next.entries[next.position].key === entry.key
      && next.entries[next.position].path === entry.path
      && next.entries[next.position].index === entry.index) {
      saveSnapshot(next);
      return;
    } else if (navigationType === 'POP') {
      const position = next.entries.findIndex(item => item.key === entry.key
        && item.index === entry.index && item.path === entry.path);
      nextDirection = position >= 0 && position < next.position ? 'back' : 'forward';
      next = position >= 0 ? { ...next, position } : freshSnapshot(owner, entry);
    } else if (navigationType === 'REPLACE') {
      const entries = [...next.entries];
      entries[next.position] = entry;
      next = { ...next, entries };
      nextDirection = 'replace';
    } else {
      const entries = [...next.entries.slice(0, next.position + 1), entry].slice(-MAX_STACK_SIZE);
      next = { ...next, entries, position: entries.length - 1 };
    }

    snapshotRef.current = next;
    setSnapshot(next);
    setDirection(nextDirection);
    saveSnapshot(next);
  }, [location, navigationType, owner, loading]);

  const goToIndex = useCallback((index: number) => {
    const { entries, position } = snapshotRef.current;
    if (!Number.isInteger(index) || index < 0 || index >= position) return;
    const target = entries[index];
    if (!safeNavigationPath(target.path) || target.path.startsWith('/auth')) return;
    const currentIndex = browserIndex();
    if (currentIndex !== null && target.index !== null && target.index < currentIndex) {
      navigate(target.index - currentIndex);
    } else if (currentIndex === null && target.index === null) {
      navigate(index - position);
    } else {
      navigate(target.path, { replace: true });
    }
  }, [navigate]);

  const goBack = useCallback((fallback: string = '/') => {
    const { entries, position } = snapshotRef.current;
    const currentPath = location.pathname + location.search + location.hash;
    for (let index = position - 1; index >= 0; index--) {
      const candidate = entries[index].path;
      if (candidate !== currentPath && !candidate.startsWith('/auth') && safeNavigationPath(candidate)) {
        goToIndex(index);
        return;
      }
    }
    const destination = safeNavigationPath(fallback) ?? '/';
    if (destination !== currentPath) navigate(destination, { replace: true });
  }, [goToIndex, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    const handleNavigateBack = () => goBack('/');
    window.addEventListener('navigate-back', handleNavigateBack);
    return () => window.removeEventListener('navigate-back', handleNavigateBack);
  }, [goBack]);

  const visible = snapshot.entries.slice(0, snapshot.position + 1);
  const currentPath = location.pathname + location.search + location.hash;
  const previousPath = [...visible].reverse().find(item => item.path !== currentPath
    && !item.path.startsWith('/auth') && safeNavigationPath(item.path))?.path ?? null;

  return (
    <NavigationStackContext.Provider value={{
      goBack, goToIndex, previousPath, direction, stack: visible.map(item => item.path),
    }}>
      {children}
    </NavigationStackContext.Provider>
  );
}

export function useNavigationStack() {
  const ctx = useContext(NavigationStackContext);
  if (!ctx) throw new Error('useNavigationStack must be used within NavigationStackProvider');
  return ctx;
}
