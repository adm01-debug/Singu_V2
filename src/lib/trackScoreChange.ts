import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

/**
 * Logs a relationship score change to the score_history table.
 * Fire-and-forget — does not block the caller.
 */
export async function trackScoreChange(params: {
  userId: string;
  contactId: string;
  scoreType: string;
  newValue: number;
  previousValue?: number | null;
  factors?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await supabase.from('score_history').insert([{
      user_id: params.userId,
      contact_id: params.contactId,
      score_type: params.scoreType,
      score_value: params.newValue,
      previous_value: params.previousValue ?? null,
      factors: (params.factors ?? null) as Json,
    }]);
    if (error) logger.warn('Failed to track score change', { error: error.message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Failed to track score change', { error: msg });
  }
}
