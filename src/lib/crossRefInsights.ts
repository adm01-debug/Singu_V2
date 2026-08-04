/**
 * Heurísticas locais (sem LLM) para gerar observações sobre o cruzamento de entidades.
 */
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface InsightEvent {
  id: string;
  occurred_at: string;
  type?: string;
  channel?: string;
  matchedIds?: string[];
}

export interface InsightTemporalDay {
  date: string;
  count: number;
}

export interface CrossRefInsight {
  id: string;
  text: string;
  severity: 'info' | 'ok' | 'warn';
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function buildCrossRefInsights(params: {
  interactions: InsightEvent[];
  temporalOverlap: InsightTemporalDay[];
  totalEntities: number;
  sharedDealsCount: number;
  overlapIndex: number;
}): CrossRefInsight[] {
  const { interactions, temporalOverlap, totalEntities, sharedDealsCount, overlapIndex } = params;
  const list: CrossRefInsight[] = [];

  // 1. Dia da semana com mais atividade
  if (interactions.length >= 3) {
    const counts = new Array(7).fill(0);
    interactions.forEach((i) => {
      try {
        const d = parseISO(i.occurred_at);
        if (!Number.isNaN(d.getTime())) counts[d.getDay()] += 1;
      } catch { /* ignore */ }
    });
    const maxIdx = counts.indexOf(Math.max(...counts));
    const max = counts[maxIdx];
    if (max > 0 && max >= Math.ceil(interactions.length * 0.3)) {
      list.push({
        id: 'weekday-peak',
        severity: 'info',
        text: `Atividade concentrada às ${WEEKDAYS[maxIdx]}s (${max} de ${interactions.length} interações).`,
      });
    }
  }

  // 2. Pico de interações por data
  if (temporalOverlap.length > 0) {
    const peak = [...temporalOverlap].sort((a, b) => b.count - a.count)[0];
    if (peak && peak.count >= 2) {
      try {
        const d = parseISO(peak.date);
        const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
        list.push({
          id: 'temporal-peak',
          severity: 'info',
          text: `Pico de ${peak.count} interações compartilhadas há ${days} dia${days === 1 ? '' : 's'} (${format(d, 'dd MMM', { locale: ptBR })}).`,
        });
      } catch { /* ignore */ }
    }
  }

  // 3. Sobreposição alta
  if (overlapIndex >= 0.4) {
    list.push({
      id: 'overlap-high',
      severity: 'ok',
      text: `Forte alinhamento: ${Math.round(overlapIndex * 100)}% das interações são comuns às entidades selecionadas.`,
    });
  } else if (overlapIndex > 0 && overlapIndex < 0.1) {
    list.push({
      id: 'overlap-low',
      severity: 'warn',
      text: `Baixa sobreposição (${Math.round(overlapIndex * 100)}%): essas entidades operam em contextos distintos.`,
    });
  }

  // 4. Deals compartilhados
  if (sharedDealsCount >= 1) {
    list.push({
      id: 'shared-deals',
      severity: 'ok',
      text: `${sharedDealsCount} deal${sharedDealsCount === 1 ? '' : 's'} compartilhado${sharedDealsCount === 1 ? '' : 's'} entre as entidades — oportunidade comum.`,
    });
  }

  // 5. Canal predominante
  const channelCounts = new Map<string, number>();
  interactions.forEach((i) => {
    const ch = (i.channel || i.type || '').toString().toLowerCase();
    if (!ch) return;
    channelCounts.set(ch, (channelCounts.get(ch) || 0) + 1);
  });
  if (channelCounts.size > 0 && interactions.length >= 4) {
    const top = [...channelCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= Math.ceil(interactions.length * 0.5)) {
      list.push({
        id: 'channel-dominant',
        severity: 'info',
        text: `Canal dominante: ${top[0].toUpperCase()} concentra ${top[1]} de ${interactions.length} interações.`,
      });
    }
  }

  // 6. Eventos plenos (todas N entidades)
  const fullMatch = interactions.filter((i) => (i.matchedIds?.length ?? 0) >= totalEntities).length;
  if (fullMatch >= 2 && totalEntities >= 3) {
    list.push({
      id: 'full-match',
      severity: 'ok',
      text: `${fullMatch} eventos envolveram simultaneamente as ${totalEntities} entidades selecionadas.`,
    });
  }

  return list.slice(0, 5);
}
