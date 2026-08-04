import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type ListDensity = 'comfortable' | 'compact';

export const BASE_TABLE_DENSITY_KEY = 'singu-table-density';
const STORAGE_EVENT = 'singu:density-change';

const DensityContext = createContext<ListDensity | null>(null);

function readFromStorage(storageKey: string): ListDensity {
  try {
    return localStorage.getItem(storageKey) === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

/**
 * Provider opcional para forçar uma densidade em uma subárvore (ex.: páginas
 * cujo modo de visualização é independente do toggle global). Quando ausente,
 * `useListDensity()` faz fallback para `localStorage` (`singu-table-density`)
 * e reage a mudanças cross-tab via `storage` event + evento custom.
 */
export function DensityProvider({
  value,
  children,
}: {
  value: ListDensity;
  children: React.ReactNode;
}) {
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

/**
 * Lê a densidade ambiente — provider > localStorage > 'comfortable'.
 *
 * Útil para componentes "passivos" como o `InfiniteScrollSentinel`, que
 * herdam a preferência sem exigir prop drilling de cada página.
 */
export function useListDensity(): ListDensity {
  const fromContext = useContext(DensityContext);
  const { user } = useAuth();
  const storageKey = `${BASE_TABLE_DENSITY_KEY}-${user?.id ?? 'anon'}`;
  const [stored, setStored] = useState<ListDensity>('comfortable');

  useEffect(() => {
    if (fromContext != null) return;
    setStored(readFromStorage(storageKey));
  }, [fromContext, storageKey]);

  useEffect(() => {
    if (fromContext != null) return;
    const sync = () => setStored(readFromStorage(storageKey));
    window.addEventListener('storage', sync);
    window.addEventListener(STORAGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(STORAGE_EVENT, sync);
    };
  }, [fromContext, storageKey]);

  return useMemo(() => fromContext ?? stored, [fromContext, stored]);
}

/**
 * Helper para escritores (ex.: `useTableDensity`) notificarem listeners
 * dentro da mesma aba. O `storage` event nativo só dispara entre abas.
 */
export function notifyDensityChange(): void {
  try {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    /* noop em ambientes sem window */
  }
}
