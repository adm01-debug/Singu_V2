import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

type EntityType = 'contact' | 'company' | 'interaction' | 'automation' | 'alert' | 'user' | 'system';
type ActivityType = 'created' | 'updated' | 'deleted' | 'viewed' | 'exported' | 'imported' | 'archived' | 'cleared' | 'access';

interface LogActivityParams {
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!user?.id) return;

    try {
      await supabase.from('activities').insert({
        user_id: user.id,
        type: params.type,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName ?? null,
        description: params.description ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata ?? null,
      } as never);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to log activity', { error: msg });
    }
  }, [user?.id]);

  return { logActivity };
}
