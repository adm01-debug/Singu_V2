import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export type Urgency = 'critical' | 'high' | 'normal' | 'low';
export type DigestMode = 'immediate' | 'hourly' | 'daily';
export type Channel = 'in_app' | 'email' | 'push' | 'whatsapp';

export interface NotificationPreferences {
  user_id: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  weekend_silence: boolean;
  enabled_channels: Channel[];
  min_urgency_email: Urgency;
  min_urgency_push: Urgency;
  digest_mode: DigestMode;
}

const DEFAULTS: Omit<NotificationPreferences, 'user_id'> = {
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  weekend_silence: false,
  enabled_channels: ['in_app'],
  min_urgency_email: 'high',
  min_urgency_push: 'critical',
  digest_mode: 'immediate',
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('user_id, quiet_hours_start, quiet_hours_end, weekend_silence, enabled_channels, min_urgency_email, min_urgency_push, digest_mode')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { user_id: user!.id, ...DEFAULTS };
      return {
        user_id: data.user_id,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
        weekend_silence: data.weekend_silence,
        enabled_channels: (data.enabled_channels ?? ['in_app']) as Channel[],
        min_urgency_email: data.min_urgency_email as Urgency,
        min_urgency_push: data.min_urgency_push as Urgency,
        digest_mode: data.digest_mode as DigestMode,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<Omit<NotificationPreferences, 'user_id'>>) => {
      if (!user?.id) throw new Error('Sem sessão');
      const current = query.data ?? { user_id: user.id, ...DEFAULTS };
      const next = { ...current, ...patch, user_id: user.id };
      const { error } = await supabase.from('notification_preferences').upsert(next, { onConflict: 'user_id' });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(['notification-preferences', user?.id], next);
      toast.success('Preferências atualizadas');
    },
    onError: (e: unknown) => toast.error(parseApiError(e)),
  });

  return { ...query, save };
}
