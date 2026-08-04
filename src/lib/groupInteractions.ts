import type { SortKey } from '@/lib/sortInteractions';

export type GroupMode = 'by-contact' | 'by-company';

export interface GroupableInteraction {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  created_at: string;
  contact_id?: string | null;
  company_id?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  tags?: string[] | null;
}

export interface LocalTimelineEvent {
  id: string;
  type: string;
  title: string;
  content: string | null;
  created_at: string;
  sentiment: string | null;
  follow_up_required: boolean | null;
}

export interface LocalTimelineGroup {
  entity_id: string;
  entity_type: 'contact' | 'company';
  entity_name: string;
  events: LocalTimelineEvent[];
  last_event_at: string;
  first_event_at: string;
  relevance_total: number;
  is_unidentified: boolean;
}

const UNIDENTIFIED_KEY = '__unidentified__';
const UNIDENTIFIED_LABEL = 'Sem identificação';

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

function relevanceScore(item: GroupableInteraction, q: string): number {
  if (!q) return 0;
  const title = item.title ?? '';
  const content = item.content ?? '';
  const tags = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  return countOccurrences(title, q) * 3 + countOccurrences(tags, q) * 2 + countOccurrences(content, q);
}

export function groupInteractions(
  items: GroupableInteraction[],
  mode: GroupMode,
  sort: SortKey,
  query?: string,
): LocalTimelineGroup[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const q = (query ?? '').trim();
  const entityType: 'contact' | 'company' = mode === 'by-contact' ? 'contact' : 'company';
  const map = new Map<string, LocalTimelineGroup>();

  for (const item of items) {
    const rawKey = mode === 'by-contact' ? item.contact_id : item.company_id;
    const rawName = mode === 'by-contact' ? item.contact_name : item.company_name;
    const key = rawKey && rawKey.trim() ? rawKey : UNIDENTIFIED_KEY;
    const name = key === UNIDENTIFIED_KEY ? UNIDENTIFIED_LABEL : (rawName?.trim() || UNIDENTIFIED_LABEL);

    let group = map.get(key);
    if (!group) {
      group = {
        entity_id: key,
        entity_type: entityType,
        entity_name: name,
        events: [],
        last_event_at: item.created_at,
        first_event_at: item.created_at,
        relevance_total: 0,
        is_unidentified: key === UNIDENTIFIED_KEY,
      };
      map.set(key, group);
    }

    group.events.push({
      id: item.id,
      type: item.type,
      title: item.title ?? '',
      content: item.content,
      created_at: item.created_at,
      sentiment: null,
      follow_up_required: null,
    });

    const ts = new Date(item.created_at).getTime();
    const lastTs = new Date(group.last_event_at).getTime();
    const firstTs = new Date(group.first_event_at).getTime();
    if (Number.isFinite(ts)) {
      if (!Number.isFinite(lastTs) || ts > lastTs) group.last_event_at = item.created_at;
      if (!Number.isFinite(firstTs) || ts < firstTs) group.first_event_at = item.created_at;
    }
    group.relevance_total += relevanceScore(item, q);

    // Atualiza nome se ainda for fallback e item tem nome real
    if (group.entity_name === UNIDENTIFIED_LABEL && key !== UNIDENTIFIED_KEY && rawName?.trim()) {
      group.entity_name = rawName.trim();
    }
  }

  const groups = Array.from(map.values());
  const effective: SortKey = sort === 'relevance' && !q ? 'recent' : sort;

  const compare = (a: LocalTimelineGroup, b: LocalTimelineGroup): number => {
    // "Sem identificação" sempre por último
    if (a.is_unidentified && !b.is_unidentified) return 1;
    if (!a.is_unidentified && b.is_unidentified) return -1;

    switch (effective) {
      case 'oldest':
        return new Date(a.first_event_at).getTime() - new Date(b.first_event_at).getTime();
      case 'entity':
        return a.entity_name.localeCompare(b.entity_name, 'pt-BR', { sensitivity: 'base' });
      case 'relevance': {
        const diff = b.relevance_total - a.relevance_total;
        if (diff !== 0) return diff;
        return new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime();
      }
      case 'recent':
      default:
        return new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime();
    }
  };

  groups.sort(compare);
  return groups;
}
