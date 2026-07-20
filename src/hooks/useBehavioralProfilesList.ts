import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BehavioralInsightItem } from '@/hooks/useBehavioralProfile';

export interface BehavioralProfileListItem {
  id: string;
  contact_id: string;
  contact_name: string | null;
  contact_avatar: string | null;
  company_id: string | null;
  company_name: string | null;
  summary: string | null;
  tone: string | null;
  communication_style: string | null;
  sentiment_trend: string | null;
  preferences: BehavioralInsightItem[];
  hobbies: BehavioralInsightItem[];
  recurrent_topics: string[];
  based_on_count: number;
  model: string | null;
  last_updated_at: string;
}

export interface BehavioralProfilesFilters {
  companyId?: string | null;
  tone?: string | null;
  period?: '7d' | '30d' | '90d' | 'all';
  search?: string;
}

function periodToDate(period: BehavioralProfilesFilters['period']): string | null {
  if (!period || period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const asArr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

interface RawProfileRow {
  id: string;
  contact_id: string;
  summary: string | null;
  tone: string | null;
  communication_style: string | null;
  sentiment_trend: string | null;
  preferences: unknown;
  hobbies: unknown;
  recurrent_topics: unknown;
  based_on_count: number | null;
  model: string | null;
  last_updated_at: string;
  contacts: {
    name: string | null;
    avatar_url: string | null;
    company_id: string | null;
    companies: { name: string | null } | null;
  } | null;
}

export interface BehavioralProfilesListResult {
  all: BehavioralProfileListItem[];
  filtered: BehavioralProfileListItem[];
}

export function useBehavioralProfilesList(filters: BehavioralProfilesFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['behavioral-profiles-list', filters.period ?? 'all', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<BehavioralProfileListItem[]> => {
      const fromDate = periodToDate(filters.period);

      let q = supabase
        .from('contact_analytical_profiles')
        .select(`
          id, contact_id, summary, tone, communication_style, sentiment_trend,
          preferences, hobbies, recurrent_topics, based_on_count, model, last_updated_at,
          contacts:contact_id ( name, avatar_url, company_id, companies:company_id ( name ) )
        `)
        .order('last_updated_at', { ascending: false })
        .limit(500);

      if (fromDate) q = q.gte('last_updated_at', fromDate);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as unknown as RawProfileRow[];
      return rows.map((r) => ({
        id: r.id,
        contact_id: r.contact_id,
        contact_name: r.contacts?.name ?? null,
        contact_avatar: r.contacts?.avatar_url ?? null,
        company_id: r.contacts?.company_id ?? null,
        company_name: r.contacts?.companies?.name ?? null,
        summary: r.summary,
        tone: r.tone,
        communication_style: r.communication_style,
        sentiment_trend: r.sentiment_trend,
        preferences: asArr<BehavioralInsightItem>(r.preferences, []),
        hobbies: asArr<BehavioralInsightItem>(r.hobbies, []),
        recurrent_topics: asArr<string>(r.recurrent_topics, []),
        based_on_count: Number(r.based_on_count ?? 0),
        model: r.model,
        last_updated_at: r.last_updated_at,
      }));
    },
  });
}

export function applyBehavioralFilters(
  items: BehavioralProfileListItem[],
  filters: BehavioralProfilesFilters,
): BehavioralProfileListItem[] {
  let out = items;
  if (filters.companyId) out = out.filter((m) => m.company_id === filters.companyId);
  if (filters.tone) out = out.filter((m) => (m.tone ?? '') === filters.tone);
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    out = out.filter(
      (m) =>
        (m.contact_name ?? '').toLowerCase().includes(q) ||
        (m.company_name ?? '').toLowerCase().includes(q) ||
        (m.summary ?? '').toLowerCase().includes(q),
    );
  }
  return out;
}

export function useBehavioralProfilesFacets(items: BehavioralProfileListItem[]) {
  const tones = new Map<string, number>();
  const companies = new Map<string, { id: string; name: string; count: number }>();
  for (const it of items) {
    if (it.tone) tones.set(it.tone, (tones.get(it.tone) ?? 0) + 1);
    if (it.company_id && it.company_name) {
      const c = companies.get(it.company_id) ?? { id: it.company_id, name: it.company_name, count: 0 };
      c.count += 1;
      companies.set(it.company_id, c);
    }
  }
  return {
    tones: Array.from(tones.entries()).map(([tone, count]) => ({ tone, count })).sort((a, b) => b.count - a.count),
    companies: Array.from(companies.values()).sort((a, b) => b.count - a.count),
  };
}