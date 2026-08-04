import { useCallback, useMemo, useState } from 'react';

/**
 * Hook genérico de seleção em massa para listas (cards/tabelas).
 *
 * Mantém um Set de ids selecionados e um modo de seleção opcional.
 * Otimizado para ListViews grandes — todas operações são O(1) ou O(n) curtas.
 *
 * Uso típico:
 *   const sel = useBulkSelection<string>();
 *   <Checkbox checked={sel.isSelected(id)} onChange={() => sel.toggle(id)} />
 *   <BulkActionsBar selectedIds={sel.ids} ... />
 */
export function useBulkSelection<TId extends string = string>(initial?: TId[]) {
  const [selectedIds, setSelectedIds] = useState<Set<TId>>(
    () => new Set(initial ?? []),
  );
  const [selectionMode, setSelectionMode] = useState(false);

  const isSelected = useCallback(
    (id: TId) => selectedIds.has(id),
    [selectedIds],
  );

  const toggle = useCallback((id: TId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const set = useCallback((id: TId, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selectAll = useCallback((ids: TId[]) => {
    setSelectedIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }, []);

  const enterMode = useCallback(() => setSelectionMode(true), []);
  const exitMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);
  const toggleMode = useCallback(() => {
    setSelectionMode((m) => {
      if (m) setSelectedIds(new Set());
      return !m;
    });
  }, []);

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const count = selectedIds.size;

  return {
    ids,
    count,
    selectionMode,
    isSelected,
    toggle,
    set,
    clear,
    selectAll,
    enterMode,
    exitMode,
    toggleMode,
  };
}
