import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface ChurnRiskData {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  segment: string | null;
  owner_name: string | null;
  churn_probability: number | null;
  confidence_level: string | null;
  risk_level: string | null;
  risk_factors: string[] | null;
  recommended_actions: string[] | null;
  churn_ranking: number | null;
  relationship_score: number | null;
  interactions_30d: number | null;
  last_interaction: string | null;
  days_since_contact: number | null;
  alert_message: string | null;
}

export function useChurnRisk(contactId: string | undefined) {
  return useQuery({
    queryKey: ['churn-risk', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ChurnRiskData>({
        table: 'vw_churn_risk_ranking',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 20 * 60 * 1000,
  });
}

export interface ChurnPrediction {
  id: string;
  contact_id: string;
  company_id: string | null;
  user_id: string;
  churn_probability: number | null;
  confidence_level: string | null;
  risk_factors: unknown;
  recommended_actions: unknown;
  predicted_at: string | null;
  created_at: string;
}

export function useChurnPredictions(contactId: string | undefined) {
  return useQuery({
    queryKey: ['churn-predictions', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<ChurnPrediction>({
        table: 'churn_predictions',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 4 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Local Churn Risk Analysis (Supabase local) ───

export interface LocalChurnRisk {
  id: string;
  contact_id: string;
  risk_level: "low" | "medium" | "high" | "critical";
  risk_score: number;
  risk_factors: Array<{ factor: string; weight: number; detail: string }>;
  recommendations: string[];
  days_since_last_interaction: number | null;
  sentiment_trend: string | null;
  score_trend: string | null;
  analyzed_at: string;
}

export function useLocalChurnRisks(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["local-churn-risks", contactId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("churn_risk_scores")
        .select("id, contact_id, risk_level, risk_score, risk_factors, recommendations, days_since_last_interaction, sentiment_trend, score_trend, analyzed_at")
        .eq("user_id", user!.id)
        .order("risk_score", { ascending: false })
        .limit(200);
      if (contactId) query = query.eq("contact_id", contactId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as LocalChurnRisk[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAnalyzeChurnRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId?: string) => {
      const { data, error } = await supabase.functions.invoke("detect-churn-risk", {
        body: contactId ? { contactId } : {},
      });
      if (error) throw error;
      return data as { success: boolean; analyzed: number; risks: LocalChurnRisk[] };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["local-churn-risks"] });
      toast.success(`Análise concluída: ${data.analyzed} contatos analisados`);
    },
    onError: () => toast.error("Erro ao analisar risco de churn"),
  });
}
