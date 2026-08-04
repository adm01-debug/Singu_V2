export type SortKey = 'recent' | 'oldest' | 'relevance' | 'entity' | 'channel';

type DateLike = string | Date | null;

interface SortableItem {
  date?: DateLike;
  created_at?: DateLike;
  data_interacao?: DateLike;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  contact_name?: string | null;
  company_name?: string | null;
  // Campos do ExternalInteraction (Ficha 360)
  assunto?: string | null;
  resumo?: string | null;
  channel?: string | null;
  direction?: string | null;
  // Tipo de canal local (usado para ordenação por canal/contagem)
  type?: string | null;
}

function getTime(item: SortableItem): number {
  const v = item.date ?? item.data_interacao ?? item.created_at;
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count += 1;
    idx += n.length;
  }
  return count;
}

function relevanceScore(item: SortableItem, q: string): number {
  const title = item.title ?? '';
  const content = item.content ?? '';
  const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  const legacy =
    countOccurrences(title, q) * 3 +
    countOccurrences(tags, q) * 2 +
    countOccurrences(content, q);
  if (legacy > 0) return legacy;
  // Fallback para ExternalInteraction (assunto 3×, resumo/canal/direction 1×)
  const assunto = item.assunto ?? '';
  const resumo = item.resumo ?? '';
  const channel = item.channel ?? '';
  const direction = item.direction ?? '';
  return (
    countOccurrences(assunto, q) * 3 +
    countOccurrences(resumo, q) +
    countOccurrences(channel, q) +
    countOccurrences(direction, q)
  );
}

function entityKey(item: SortableItem): string {
  return (item.contact_name ?? item.company_name ?? '').trim();
}

function channelKey(item: SortableItem): string {
  const raw = item.type ?? item.channel ?? '';
  return typeof raw === 'string' ? raw.toLowerCase() : '';
}

export function sortInteractions<T extends SortableItem>(
  items: T[],
  sort: SortKey,
  query?: string,
  channelCounts?: Record<string, number>,
): T[] {
  if (!Array.isArray(items)) return [];
  const arr = items.slice();
  const q = (query ?? '').trim();
  const effective: SortKey = sort === 'relevance' && !q ? 'recent' : sort;

  switch (effective) {
    case 'oldest':
      return arr.sort((a, b) => getTime(a) - getTime(b));
    case 'entity':
      return arr.sort((a, b) => {
        const cmp = entityKey(a).localeCompare(entityKey(b), 'pt-BR', { sensitivity: 'base' });
        return cmp !== 0 ? cmp : getTime(b) - getTime(a);
      });
    case 'channel':
      // Ordena por contagem do canal (decrescente, usando os mesmos números
      // exibidos nos chips). Empate: nome do canal asc, depois mais recente.
      return arr.sort((a, b) => {
        const ka = channelKey(a);
        const kb = channelKey(b);
        const ca = channelCounts?.[ka] ?? 0;
        const cb = channelCounts?.[kb] ?? 0;
        if (cb !== ca) return cb - ca;
        if (ka !== kb) return ka.localeCompare(kb, 'pt-BR');
        return getTime(b) - getTime(a);
      });
    case 'relevance':
      return arr.sort((a, b) => {
        const sb = relevanceScore(b, q) - relevanceScore(a, q);
        return sb !== 0 ? sb : getTime(b) - getTime(a);
      });
    case 'recent':
    default:
      return arr.sort((a, b) => getTime(b) - getTime(a));
  }
}
