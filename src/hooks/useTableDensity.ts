import { useState, useCallback } from 'react';
import { notifyDensityChange } from '@/contexts/DensityContext';

export type TableDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'singu-table-density';

/**
 * Hook to manage table density preference (comfortable vs compact).
 * Persists choice in localStorage and notifies in-tab listeners
 * (e.g., `useListDensity`) so passive consumers like `InfiniteScrollSentinel`
 * react instantly without prop drilling.
 */
export function useTableDensity() {
  const [density, setDensityState] = useState<TableDensity>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const setDensity = useCallback((d: TableDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      // ignora falhas de acesso ao localStorage (ex.: modo privado)
    }
    notifyDensityChange();
  }, []);


  const toggle = useCallback(() => {
    setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
  }, [density, setDensity]);

  const isCompact = density === 'compact';

  /** Tailwind class helpers */
  const cellPadding = isCompact ? 'px-3 py-1.5' : 'px-4 py-3';
  const rowHeight = isCompact ? 'h-9' : 'h-12';
  const textSize = isCompact ? 'text-xs' : 'text-sm';
  const gap = isCompact ? 'gap-1' : 'gap-2';

  return {
    density,
    setDensity,
    toggle,
    isCompact,
    cellPadding,
    rowHeight,
    textSize,
    gap,
  };
}
