import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert } from '@/integrations/supabase/types';

export type AttributionModel = 'first' | 'last' | 'linear' | 'u_shape' | 'w_shape' | 'time_decay';

export interface Touchpoint {
  id: string;
  user_id: string;
  contact_id: string | null;
  deal_id: string | null;
  touchpoint_type: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  page_url: string | null;
  occurred_at: string;
  value_attributed: number;
  metadata: Record<string, unknown>;
}

export interface Allocation {
  touchpoint_id: string;
  type: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  occurred_at: string;
  share: number;
  value: number;
}

export function useTouchpoints(opts: { contactId?: string; dealId?: string }) {
  return useQuery({
    queryKey: ['touchpoints', opts.contactId, opts.dealId],
    enabled: !!(opts.contactId || opts.dealId),
    queryFn: async () => {
      let q = supabase.from('attribution_touchpoints').select('*').order('occurred_at', { ascending: false }).limit(500);
      if (opts.contactId) q = q.eq('contact_id', opts.contactId);
      if (opts.dealId) q = q.eq('deal_id', opts.dealId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Touchpoint[];
    },
    staleTime: 60_000,
  });
}

export function useAttribution(dealId: string | undefined, model: AttributionModel = 'linear', dealValue = 0) {
  return useQuery({
    queryKey: ['attribution', dealId, model, dealValue],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compute_attribution', {
        _deal_id: dealId!,
        _model: model,
        _deal_value: dealValue,
      });
      if (error) throw error;
      return data as unknown as { model: string; allocations: Allocation[]; total_value: number; touchpoints_count: number };
    },
    staleTime: 30_000,
  });
}

export function useRecordTouchpoint() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Touchpoint> & { touchpoint_type: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('attribution_touchpoints').insert({ ...input, user_id: user.id } as TablesInsert<'attribution_touchpoints'>);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['touchpoints'] }); toast.success('Touchpoint registrado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
