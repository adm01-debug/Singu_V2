import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogPayload {
  contactId: string;
  score: number;
  recommendationType: string;
  reasons: string[];
  dataUsed?: Record<string, unknown>;
  userAction?: string;
}

export function useRecommendationAudit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AuditLogPayload) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_recommendation_audit_logs_v2')
        .insert([{
          user_id: auth.user.id,
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
