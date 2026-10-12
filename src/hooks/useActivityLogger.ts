import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type EntityType = 'contact' | 'company' | 'interaction';
type ActivityType = 'created' | 'updated' | 'deleted';

interface LogActivityParams {
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description?: string;
  reason?: string;
  metadata?: Record<string, Json | undefined>;
}

export function useActivityLogger() {
  const { user } = useAuth();

  const logActivity = useCallback(async (params: LogActivityParams) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        type: `${params.entityType}_${params.type}`,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName ?? null,
        description: params.description ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata ?? null,
      });
      if (error) logger.warn('Failed to log activity', { error: error.message });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to log activity', { error: msg });
    }
  }, [user?.id]);

  return { logActivity };
}
