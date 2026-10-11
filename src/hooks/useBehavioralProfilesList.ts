import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BehavioralInsightItem } from '@/hooks/useBehavioralProfile';
import { z } from 'zod';

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

const insightItemsSchema = z.array(z.object({ label: z.string(), evidence: z.string().optional() }));

function normalizeInsights(value: unknown): BehavioralInsightItem[] {
  return insightItemsSchema.parse(value ?? []).map(item => ({ label: item.label, evidence: item.evidence }));
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
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<BehavioralProfileListItem[]> => {
      const fromDate = periodToDate(filters.period);

      let q = supabase
        .from('contact_analytical_profiles')
        .select(`
          id, contact_id, summary, tone, communication_style, sentiment_trend,
          preferences, hobbies, recurrent_topics, based_on_count, model, last_updated_at
        `)
        .eq('user_id', user!.id)
        .order('last_updated_at', { ascending: false });

      if (fromDate) q = q.gte('last_updated_at', fromDate);

      const { data, error } = await q;
      if (error) throw error;

      const rows = data ?? [];
      const contactIds = [...new Set(rows.flatMap(row => row.contact_id ? [row.contact_id] : []))];
      const { data: contacts, error: contactsError } = contactIds.length > 0
        ? await supabase.from('contacts').select('id, full_name, avatar_url, company_id').in('id', contactIds).eq('user_id', user!.id)
        : { data: [], error: null };
      if (contactsError) throw contactsError;
      const contactsById = new Map((contacts ?? []).map(contact => [contact.id, contact]));
      const companyIds = [...new Set((contacts ?? []).flatMap(contact => contact.company_id ? [contact.company_id] : []))];
      const { data: companies, error: companiesError } = companyIds.length > 0
        ? await supabase.from('companies').select('id, nome_crm').in('id', companyIds)
        : { data: [], error: null };
      if (companiesError) throw companiesError;
      const companiesById = new Map((companies ?? []).map(company => [company.id, company]));
      return rows.map((r) => ({
        id: r.id,
        contact_id: z.string().parse(r.contact_id),
        contact_name: contactsById.get(r.contact_id)?.full_name ?? null,
        contact_avatar: contactsById.get(r.contact_id)?.avatar_url ?? null,
        company_id: contactsById.get(r.contact_id)?.company_id ?? null,
        company_name: companiesById.get(contactsById.get(r.contact_id)?.company_id)?.nome_crm ?? null,
        summary: r.summary,
        tone: r.tone,
        communication_style: r.communication_style,
        sentiment_trend: r.sentiment_trend,
        preferences: normalizeInsights(r.preferences),
        hobbies: normalizeInsights(r.hobbies),
        recurrent_topics: z.array(z.string()).parse(r.recurrent_topics ?? []),
        based_on_count: Number(r.based_on_count ?? 0),
        model: r.model,
        last_updated_at: z.string().parse(r.last_updated_at),
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