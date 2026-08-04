import { useMemo } from 'react';
import type { HistoryEntry } from './useEntityHistory';

const GENERIC: string[] = [
  'Top 10 contatos por score de relacionamento',
  'Quais empresas têm deals abertos acima de 100k?',
  'Quantas interações tive nos últimos 7 dias?',
  'Mostre os 5 deals mais antigos no pipeline',
];

/**
 * Gera sugestões contextuais para o AskTab a partir da última entidade
 * aberta no Entity 360. Fallback para sugestões genéricas.
 */
export function useContextualSuggestions(entity: HistoryEntry | null): string[] {
  return useMemo(() => {
    if (!entity) return GENERIC;
    const name = entity.name;
    if (entity.type === 'contact') {
      return [
        `Últimas 10 interações com ${name}`,
        `Deals abertos do contato ${name}`,
        `Score e histórico de relacionamento de ${name}`,
        `Próximas ações sugeridas para ${name}`,
      ];
    }
    if (entity.type === 'company') {
      return [
        `Contatos ativos da empresa ${name}`,
        `Deals abertos da empresa ${name}`,
        `Últimas 10 interações da empresa ${name}`,
        `Faturamento estimado e segmento da ${name}`,
      ];
    }
    return [
      `Detalhes do deal ${name}`,
      `Histórico de estágios do deal ${name}`,
      `Contatos vinculados ao deal ${name}`,
      `Probabilidade de fechamento do deal ${name}`,
    ];
  }, [entity]);
}
