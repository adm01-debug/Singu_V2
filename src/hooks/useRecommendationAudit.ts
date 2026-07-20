import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AuditLogPayload {
  contactId: string;
  score: number;
  recommendationType: string;
  reasons: string[];
  dataUsed?: Record<string, unknown>;
  userAction?: string;
}

export function useRecommendationAudit() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuditLogPayload) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_recommendation_audit_logs_v2')
        .insert([{
          user_id: user!.id,
          contact_id: payload.contactId,
          score: payload.score,
          recommendation_type: payload.recommendationType,
          reasons: payload.reasons,
          data_used: (payload.dataUsed ?? {}) as never,
          user_action: payload.userAction,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-recommendation-audit-logs'] });
    },
    onError: (error) => {
      console.error('Audit log error:', error);
    }
  });
}
