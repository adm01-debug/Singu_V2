import { useMemo } from 'react';
import { useContactView360 } from './useContactView360';
import { useContactIntelligence } from './useContactIntelligence';
import { useExternalInteractions, type ExternalInteraction } from './useExternalInteractions';
import { useRapportIntel } from './useRapportIntelView';
import { useRapportPoints } from './useRapportPoints';

/**
 * Hook agregador para a tela "Ficha 360".
 * Compõe múltiplas queries (TanStack Query) em uma única view consolidada,
 * sem useEffect e com fallback gracioso por bloco.
 */
export interface UseFicha360Options {
  days?: number;
  channels?: string[];
  interactionsLimit?: number;
}

export function useFicha360(contactId: string | undefined, options: UseFicha360Options = {}) {
  const { days, channels, interactionsLimit = 50 } = options;
  const view360 = useContactView360(contactId);
  const intelligence = useContactIntelligence(contactId ?? '', !!contactId);
  const interactions = useExternalInteractions(contactId, interactionsLimit, { days, channels });
  const rapportIntel = useRapportIntel(contactId);
  const rapportPoints = useRapportPoints(contactId);

  const recentInteractions: ExternalInteraction[] = useMemo(() => {
    return Array.isArray(interactions.data) ? interactions.data : [];
  }, [interactions.data]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      whatsapp: 0,
      email: 0,
      call: 0,
      meeting: 0,
      note: 0,
      total: 0,
    };
    if (!Array.isArray(recentInteractions)) return counts;
    for (const item of recentInteractions) {
      const ch = (item.channel || '').toLowerCase();
      if (ch in counts) counts[ch] += 1;
      counts.total += 1;
    }
    return counts;
  }, [recentInteractions]);

  const isLoading =
    view360.isLoading ||
    intelligence.isLoading ||
    interactions.isLoading ||
    rapportIntel.isLoading ||
    rapportPoints.isLoading;

  return {
    profile: view360.data ?? null,
    intelligence: intelligence.data ?? null,
    recentInteractions,
    rapportIntel: rapportIntel.data ?? null,
    rapportPoints: rapportPoints.data ?? null,
    channelCounts,
    isLoading,
    interactionsFetching: interactions.isFetching,
    isError:
      view360.isError &&
      intelligence.isError &&
      interactions.isError &&
      rapportIntel.isError &&
      rapportPoints.isError,
  };
}
