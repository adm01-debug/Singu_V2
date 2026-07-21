import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

export function useGeoSalesData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bi-geo-sales', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, lat, lng, city, state')
        .eq('user_id', user.id)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(500);

      if (!companies?.length) return [];

      // Both queries are independent of each other — run in parallel
      const [{ data: contacts }, { data: interactions }] = await Promise.all([
        supabase.from('contacts').select('company_id').eq('user_id', user.id).limit(10000),
        supabase.from('interactions').select('company_id').eq('user_id', user.id).not('company_id', 'is', null).limit(10000),
      ]);

      const contactCount = new Map<string, number>();
      for (const c of contacts || []) {
        if (c.company_id) contactCount.set(c.company_id, (contactCount.get(c.company_id) || 0) + 1);
      }

      const interactionCount = new Map<string, number>();
      for (const i of interactions || []) {
        if (i.company_id) interactionCount.set(i.company_id, (interactionCount.get(i.company_id) || 0) + 1);
      }

      return companies.map(c => ({
        lat: c.lat!,
        lng: c.lng!,
        company_name: c.name,
        city: c.city || '',
        state: c.state || '',
        interaction_count: interactionCount.get(c.id) || 0,
        contact_count: contactCount.get(c.id) || 0,
      })) as GeoSalesPoint[];
    },
    staleTime: 10 * 60 * 1000,
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
