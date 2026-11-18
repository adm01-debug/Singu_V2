import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resumo de 30 dias do log de auditoria, vindo da edge function `audit-analytics`.
 *
 * A function já estava publicada em produção e não tinha nenhum chamador: a
 * tela de Audit Trail listava linha crua sobre uma tabela de ~400 mil
 * registros, sem nenhuma visão agregada. O resumo é escopado ao usuário que
 * chama (a function filtra por `user_id` do JWT).
 */

export interface ResumoAuditoria {
  total_logs: number;
  top_entities: { entity: string; count: number }[];
  operations_by_type: { action: string; count: number }[];
  activity_by_hour: { hour: number; count: number }[];
  period: string;
}

export function useAuditAnalytics(habilitado = true) {
  return useQuery<ResumoAuditoria>({
    queryKey: ['audit-analytics', '30d'],
    enabled: habilitado,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('audit-analytics', { body: {} });
      if (error) throw error;
      return data as ResumoAuditoria;
    },
  });
}
