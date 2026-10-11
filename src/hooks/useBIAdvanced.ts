import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

// ── Demand Forecast ──
export interface DemandForecast {
  historical: Array<{ month: string; interactions: number; positive: number; negative: number }>;
  forecast: Array<{ month: string; predicted_interactions: number; confidence: number; trend: string }>;
  insights: string[];
  seasonality_detected: boolean;
  growth_rate_percent: number;
}

export function useDemandForecast() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('demand-forecast', { body: {} });
      if (error) throw error;
      return data as DemandForecast;
    },
    onError: () => toast.error('Erro ao gerar previsão de demanda'),
  });
}

// ── Profitability Analysis (uses local data) ──
export interface ProfitabilityItem {
  id: string;
  name: string;
  interactions: number;
  deals_count: number;
  total_value: number;
  avg_sentiment_score: number;
  roi_score: number;
}

export function useProfitabilityByContact() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bi-profitability-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      // Both queries are independent — run in parallel
      const [{ data: contacts }, { data: interactions }] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, relationship_score, sentiment').eq('user_id', user.id).limit(100),
        supabase.from('interactions').select('contact_id, type, sentiment').eq('user_id', user.id).limit(5000),
      ]);

      if (!contacts) return [];

      const interactionMap = new Map<string, { count: number; positive: number; negative: number }>();
      for (const i of interactions || []) {
        const curr = interactionMap.get(i.contact_id) || { count: 0, positive: 0, negative: 0 };
        curr.count++;
        if (i.sentiment === 'positive' || i.sentiment === 'very_positive') curr.positive++;
        if (i.sentiment === 'negative' || i.sentiment === 'very_negative') curr.negative++;
        interactionMap.set(i.contact_id, curr);
      }

      return contacts.map(c => {
        const stats = interactionMap.get(c.id) || { count: 0, positive: 0, negative: 0 };
        const sentimentScore = stats.count > 0 ? ((stats.positive - stats.negative) / stats.count) * 100 : 0;
        return {
          id: c.id,
          name: `${c.first_name} ${c.last_name}`.trim(),
          interactions: stats.count,
          deals_count: 0,
          total_value: 0,
          avg_sentiment_score: Math.round(sentimentScore),
          roi_score: Math.round((c.relationship_score || 0) * 0.6 + (stats.count > 0 ? Math.min(stats.count * 5, 40) : 0)),
        } as ProfitabilityItem;
      }).sort((a, b) => b.roi_score - a.roi_score);
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ── Geo Sales Heatmap ──
export interface GeoSalesPoint {
  lat: number;
  lng: number;
  company_name: string;
  city: string;
  state: string;
  interaction_count: number;
  contact_count: number;
}

type GeoCompanyAddress = Pick<Tables<'company_addresses'>, 'company_id' | 'latitude' | 'longitude' | 'cidade' | 'estado' | 'is_primary'>;

async function fetchGeoCompanyAddresses(companyIds: string[], userId: string): Promise<Map<string, GeoCompanyAddress>> {
  const addresses = new Map<string, GeoCompanyAddress>();
  for (let offset = 0; offset < companyIds.length; offset += 100) {
    const batch = companyIds.slice(offset, offset + 100);
    let cursor: string | undefined;
    for (;;) {
      let query = supabase.from('company_addresses')
        .select('id, company_id, latitude, longitude, cidade, estado, is_primary, companies!inner(user_id)')
        .eq('companies.user_id', userId).in('company_id', batch)
        .not('latitude', 'is', null).not('longitude', 'is', null)
        .gte('latitude', -90).lte('latitude', 90).gte('longitude', -180).lte('longitude', 180)
        .order('id', { ascending: true }).limit(500);
      if (cursor) query = query.gt('id', cursor);
      const { data, error } = await query;
      if (error) throw error;
      if (!data) throw new Error('Resposta inválida ao consultar endereços');
      for (const address of data) {
        const current = addresses.get(address.company_id);
        if (!current || (!current.is_primary && address.is_primary)) addresses.set(address.company_id, address);
      }
      if (data.length < 500) break;
      const nextCursor = data[data.length - 1].id;
      if (cursor && nextCursor <= cursor) throw new Error('A paginação dos endereços não avançou');
      cursor = nextCursor;
    }
  }
  return addresses;
}

async function countGeoRelations(table: 'contacts' | 'interactions', userId: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  let cursor: string | undefined;
  for (;;) {
    let query = supabase.from(table).select('id, company_id').eq('user_id', userId)
      .not('company_id', 'is', null).order('id', { ascending: true }).limit(500);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    if (error) throw error;
    if (!data) throw new Error('Resposta inválida ao consultar vínculos');
    for (const row of data) {
      if (row.company_id) counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
    }
    if (data.length < 500) break;
    const nextCursor = data[data.length - 1].id;
    if (cursor && nextCursor <= cursor) throw new Error('A paginação dos vínculos não avançou');
    cursor = nextCursor;
  }
  return counts;
}

export function useGeoSalesData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bi-geo-sales', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const companies: Pick<Tables<'companies'>, 'id' | 'nome_crm'>[] = [];
      let companyCursor: string | undefined;
      for (;;) {
        let query = supabase.from('companies').select('id, nome_crm')
          .eq('user_id', user.id).order('id', { ascending: true }).limit(500);
        if (companyCursor) query = query.gt('id', companyCursor);
        const { data, error } = await query;
        if (error) throw error;
        if (!data) throw new Error('Resposta inválida ao consultar empresas');
        companies.push(...data);
        if (data.length < 500) break;
        const nextCursor = data[data.length - 1].id;
        if (companyCursor && nextCursor <= companyCursor) throw new Error('A paginação das empresas não avançou');
        companyCursor = nextCursor;
      }
      if (!companies.length) return [];

      const [contactCount, interactionCount, addresses] = await Promise.all([
        countGeoRelations('contacts', user.id),
        countGeoRelations('interactions', user.id),
        fetchGeoCompanyAddresses(companies.map(c => c.id), user.id),
      ]);

      return companies.flatMap(c => {
        const address = addresses.get(c.id);
        if (!address || address.latitude == null || address.longitude == null) return [];
        return [{
          lat: address.latitude,
          lng: address.longitude,
          company_name: c.nome_crm,
          city: address.cidade || '',
          state: address.estado || '',
          interaction_count: interactionCount.get(c.id) || 0,
          contact_count: contactCount.get(c.id) || 0,
        } satisfies GeoSalesPoint];
      });
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ── Embeddable Dashboard Config ──
export interface EmbeddableDashboard {
  id: string;
  title: string;
  description: string;
  widgets: string[];
  created_at: string;
}

export function useEmbeddableDashboards() {
  // Client-side predefined dashboards
  const dashboards: EmbeddableDashboard[] = [
    {
      id: 'executive',
      title: 'Visão Executiva',
      description: 'KPIs principais, pipeline e forecast',
      widgets: ['kpis', 'pipeline', 'forecast', 'cohort'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'sales',
      title: 'Performance Comercial',
      description: 'Métricas de vendas, conversão e velocidade',
      widgets: ['conversion', 'velocity', 'profitability', 'geo'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'customer-health',
      title: 'Saúde do Cliente',
      description: 'Churn, NPS, sentimento e engajamento',
      widgets: ['churn', 'sentiment', 'cohort', 'engagement'],
      created_at: new Date().toISOString(),
    },
  ];

  return { dashboards };
}
