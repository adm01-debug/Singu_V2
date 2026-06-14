import type { Interaction } from '@/hooks/useInteractions';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

/**
 * Chave estável de cada filtro ativo. Usada como `key` em listas React e como
 * identificador em testes — não é exibida ao usuário.
 */
export type IsolatedFilterKey =
  | 'q'
  | 'contact'
  | 'company'
  | 'direcao'
  | 'canais'
  | 'de'
  | 'ate'
  | 'sentimento';

export interface IsolatedFilterCount {
  key: IsolatedFilterKey;
  /** Rótulo curto exibido no microdetalhe compacto (ex.: "Pessoa", "WhatsApp"). */
  label: string;
  /** Quantos itens do dataset bruto sobreviveriam se APENAS este filtro estivesse ativo. */
  count: number;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  video_call: 'Vídeo',
  note: 'Nota',
};

/**
 * Para cada filtro ativo, computa quantos itens do dataset bruto sobreviveriam
 * se APENAS aquele filtro estivesse aplicado (microdetalhe "isolado").
 *
 * Usado pelo `ActiveFiltersBar` para mostrar de forma compacta quais filtros
 * estão reduzindo mais o resultado quando há muitos filtros ativos.
 *
 * Contratos:
 * - Itens cujo filtro está inativo são omitidos do retorno.
 * - O filtro `canais` é tratado como UM único filtro (união lógica dos canais
 *   selecionados), pois é assim que ele aparece na URL e na contagem oficial.
 * - Datas são interpretadas no fuso local com bordas de dia (00:00:00 / 23:59:59).
 */
export function computeIsolatedFilterCounts(
  interactions: Interaction[] | null | undefined,
  filters: AdvancedFilters,
  debouncedQ: string,
  contactLabel?: string | null,
  companyLabel?: string | null,
): IsolatedFilterCount[] {
  if (!Array.isArray(interactions) || interactions.length === 0) return [];
  const out: IsolatedFilterCount[] = [];

  const qTrim = (debouncedQ ?? '').trim();
  if (qTrim) {
    const q = normalize(qTrim);
    let n = 0;
    for (const i of interactions) {
      const hay = normalize(`${i.title ?? ''} ${i.content ?? ''} ${(i.tags ?? []).join(' ')}`);
      if (hay.includes(q)) n += 1;
    }
    const qTrimmed = qTrim.length > 20 ? `${qTrim.slice(0, 20)}…` : qTrim;
    out.push({ key: 'q', label: `Busca “${qTrimmed}”`, count: n });
  }

  if (filters.contact) {
    const id = filters.contact;
    let n = 0;
    for (const i of interactions) if (i.contact_id === id) n += 1;
    const label = contactLabel ? `Pessoa ${contactLabel}` : 'Pessoa';
    out.push({ key: 'contact', label, count: n });
  }

  if (filters.company) {
    const id = filters.company;
    let n = 0;
    for (const i of interactions) if (i.company_id === id) n += 1;
    const label = companyLabel ? `Empresa ${companyLabel}` : 'Empresa';
    out.push({ key: 'company', label, count: n });
  }

  if (filters.direcao === 'inbound' || filters.direcao === 'outbound') {
    const target = filters.direcao === 'inbound' ? 'them' : 'us';
    let n = 0;
    for (const i of interactions) if (i.initiated_by === target) n += 1;
    out.push({
      key: 'direcao',
      label: filters.direcao === 'inbound' ? 'Recebidas' : 'Enviadas',
      count: n,
    });
  }

  const canais = Array.isArray(filters.canais) ? filters.canais : [];
  if (canais.length > 0) {
    const set = new Set(canais);
    let n = 0;
    for (const i of interactions) if (set.has(i.type)) n += 1;
    const label =
      canais.length === 1
        ? CHANNEL_LABELS[canais[0]] ?? canais[0]
        : `${canais.length} canais`;
    out.push({ key: 'canais', label, count: n });
  }

  if (filters.de instanceof Date && !Number.isNaN(filters.de.getTime())) {
    const deTs = new Date(filters.de).setHours(0, 0, 0, 0);
    let n = 0;
    for (const i of interactions) if (new Date(i.created_at).getTime() >= deTs) n += 1;
    out.push({ key: 'de', label: 'Desde', count: n });
  }

  if (filters.ate instanceof Date && !Number.isNaN(filters.ate.getTime())) {
    const ateTs = new Date(filters.ate).setHours(23, 59, 59, 999);
    let n = 0;
    for (const i of interactions) if (new Date(i.created_at).getTime() <= ateTs) n += 1;
    out.push({ key: 'ate', label: 'Até', count: n });
  }

  if (filters.sentimento) {
    const target = filters.sentimento;
    let n = 0;
    for (const i of interactions) if (i.sentiment === target) n += 1;
    const map: Record<string, string> = {
      positive: 'Positivo',
      neutral: 'Neutro',
      negative: 'Negativo',
      mixed: 'Misto',
    };
    out.push({ key: 'sentimento', label: map[target] ?? target, count: n });
  }

  return out;
}

/**
 * Seleciona os N filtros que mais reduzem o resultado (menores contagens
 * isoladas). Empate é resolvido pela ordem original (estável), preservando a
 * sequência em que os filtros aparecem na barra.
 */
export function pickMostReducingFilters(
  counts: IsolatedFilterCount[],
  n: number,
): IsolatedFilterCount[] {
  if (!Array.isArray(counts) || counts.length === 0 || n <= 0) return [];
  const indexed = counts.map((c, idx) => ({ c, idx }));
  indexed.sort((a, b) => {
    if (a.c.count !== b.c.count) return a.c.count - b.c.count;
    return a.idx - b.idx;
  });
  return indexed.slice(0, n).map((x) => x.c);
}
