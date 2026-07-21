import { useState, useCallback, useEffect } from 'react';
import { notifyDensityChange, BASE_TABLE_DENSITY_KEY } from '@/contexts/DensityContext';
import { useAuth } from '@/hooks/useAuth';

export type TableDensity = 'comfortable' | 'compact';

export function useTableDensity() {
  const { user } = useAuth();
  const storageKey = `${BASE_TABLE_DENSITY_KEY}-${user?.id ?? 'anon'}`;
  const [density, setDensityState] = useState<TableDensity>('comfortable');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setDensityState(stored === 'compact' ? 'compact' : 'comfortable');
    } catch {
      setDensityState('comfortable');
    }
  }, [storageKey]);

  const setDensity = useCallback((d: TableDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(storageKey, d);
    } catch {
      // ignora falhas de acesso ao localStorage (ex.: modo privado)
    }
    notifyDensityChange();
  }, [storageKey]);

  const toggle = useCallback(() => {
    setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
  }, [density, setDensity]);

  const isCompact = density === 'compact';

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
