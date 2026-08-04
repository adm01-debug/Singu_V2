import { useCallback, useEffect, useState } from 'react';
import type { Ficha360Period } from './useFicha360Filters';

/**
 * Mantém um estado "rascunho" de filtros (período + canais) separado do
 * estado aplicado (URL). Permite ajustar múltiplos filtros sem disparar
 * fetches a cada clique — só ao chamar `onApply` na UI o consumidor
 * propaga os valores para a URL.
 *
 * Ressincroniza automaticamente se o aplicado mudar por fonte externa
 * (presets, navegação back/forward, deep-link).
 */
export function useFicha360DraftFilters(
  appliedDays: Ficha360Period,
  appliedChannels: string[],
) {
  const [draftDays, setDraftDays] = useState<Ficha360Period>(appliedDays);
  const [draftChannels, setDraftChannels] = useState<string[]>(appliedChannels);

  useEffect(() => {
    setDraftDays(appliedDays);
  }, [appliedDays]);

  const appliedKey = appliedChannels.slice().sort().join(',');
  useEffect(() => {
    setDraftChannels(appliedChannels);
    // appliedKey é a forma estável de detectar mudança de conteúdo do array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);

  const isDirty =
    draftDays !== appliedDays ||
    draftChannels.length !== appliedChannels.length ||
    draftChannels.some((c) => !appliedChannels.includes(c));

  const reset = useCallback(() => {
    setDraftDays(appliedDays);
    setDraftChannels(appliedChannels);
  }, [appliedDays, appliedChannels]);

  return {
    draftDays,
    draftChannels,
    setDraftDays,
    setDraftChannels,
    isDirty,
    reset,
  };
}
