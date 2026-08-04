import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';

interface DistributePayload {
  contactId?: string;
  companyId?: string;
  ruleId?: string;
  roleFilter?: 'sdr' | 'closer' | 'any';
}

interface RedistributePayload {
  inactivityDays?: number;
}

interface DistributeResult {
  success: boolean;
  assigned_to: string;
  member_name: string;
}

interface RedistributeResult {
  redistributed: number;
  message: string;
}

export function useServerDistribute() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DistributePayload): Promise<DistributeResult> => {
      const { data, error } = await supabase.functions.invoke('lead-routing', {
        body: {
          action: 'distribute',
          contact_id: payload.contactId,
          company_id: payload.companyId,
          rule_id: payload.ruleId,
          role_filter: payload.roleFilter ?? 'any',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as DistributeResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['lead-assignments'] });
      qc.invalidateQueries({ queryKey: ['sales-team-members'] });
      toast.success(`Lead distribuído para ${result.member_name}`);
    },
    onError: (err) => {
      logger.error('[ServerDistribute]', err);
      toast.error(parseApiError(err, 'Erro ao distribuir lead'));
    },
  });
}

export function useServerRedistribute() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: RedistributePayload): Promise<RedistributeResult> => {
      const { data, error } = await supabase.functions.invoke('lead-routing', {
        body: {
          action: 'redistribute',
          inactivity_days: payload?.inactivityDays ?? 7,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as RedistributeResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['lead-assignments'] });
      qc.invalidateQueries({ queryKey: ['sales-team-members'] });
      qc.invalidateQueries({ queryKey: ['routing-metrics'] });
      if (result.redistributed > 0) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    },
    onError: (err) => {
      logger.error('[ServerRedistribute]', err);
      toast.error(parseApiError(err, 'Erro na redistribuição'));
    },
  });
}

export function useResetDailyCounts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('lead-routing', {
        body: { action: 'reset_daily' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sales-team-members'] });
      toast.success(`Contadores diários resetados (${data?.reset_count ?? 0} membros)`);
    },
    onError: () => toast.error('Erro ao resetar contadores'),
  });
}
