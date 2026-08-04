import { useMemo } from 'react';
import { useExternalInteractions } from './useExternalInteractions';
import { countByChannel } from '@/lib/countByChannel';
import type { Ficha360Period } from './useFicha360Filters';

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Conta interações por canal no período ativo.
 *
 * Retorna dois mapas:
 * - `totals`: Y por canal — período only, ignora `channels` e `q`.
 * - `filtered`: X por canal — período + canais + busca textual aplicados.
 *
 * Reutiliza `useExternalInteractions` sem `channels` (queryKey distinta) e
 * calcula ambas as contagens em memória sobre o mesmo array — sem custo extra
 * de rede.
 */
export function useFicha360ChannelCounts(
  contactId: string | undefined,
  days: Ficha360Period,
  q?: string,
  channels?: string[],
) {
  const query = useExternalInteractions(contactId, 200, { days });

  const totals = useMemo(() => countByChannel(query.data), [query.data]);

  const filtered = useMemo(() => {
    const list = Array.isArray(query.data) ? query.data : [];
    const term = (q ?? '').trim();
    const needle = term ? normalize(term) : '';
    const channelSet =
      Array.isArray(channels) && channels.length > 0
        ? new Set(channels.map((c) => c.toLowerCase()))
        : null;

    const subset = list.filter((it) => {
      const ch = (it.channel || '').toLowerCase();
      if (channelSet && (!ch || !channelSet.has(ch))) return false;
      if (needle) {
        const haystack = normalize(
          [it.assunto ?? '', it.resumo ?? '', it.channel ?? '', it.direction ?? ''].join(' '),
        );
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return countByChannel(subset);
  }, [query.data, q, channels]);

  return {
    counts: totals, // backwards-compat
    totals,
    filtered,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}
