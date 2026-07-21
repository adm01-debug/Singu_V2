import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export type ContactTimeAnalysis = Tables<'contact_time_analysis'>;

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}h`);

export interface BestTimeSlot {
  dayOfWeek: number;
  dayLabel: string;
  hourOfDay: number;
  hourLabel: string;
  successRate: number;
  totalAttempts: number;
}

export function useContactTimeAnalysis(contactId?: string) {
  const { user } = useAuth();

  const { data: timeData = [], isLoading: loading } = useQuery({
    queryKey: ['contact-time-analysis', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_time_analysis')
        .select('*')
        .eq('contact_id', contactId!)
        .eq('user_id', user?.id ?? '')
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const bestTimes: BestTimeSlot[] = timeData
    .filter(t => (t.total_attempts || 0) > 0)
    .map(t => ({
      dayOfWeek: t.day_of_week,
      dayLabel: DAY_LABELS[t.day_of_week] || '?',
      hourOfDay: t.hour_of_day,
      hourLabel: HOUR_LABELS[t.hour_of_day] || '?',
      successRate: (t.total_attempts || 0) > 0 ? ((t.success_count || 0) / (t.total_attempts || 1)) * 100 : 0,
      totalAttempts: t.total_attempts || 0,
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5);

  const heatmapData = DAY_LABELS.map((dayLabel, dayIdx) => ({
    day: dayLabel,
    hours: Array.from({ length: 24 }, (_, hour) => {
      const slot = timeData.find(t => t.day_of_week === dayIdx && t.hour_of_day === hour);
      return {
        hour,
        successRate: slot && (slot.total_attempts || 0) > 0 ? ((slot.success_count || 0) / (slot.total_attempts || 1)) * 100 : 0,
        attempts: slot?.total_attempts || 0,
      };
    }),
  }));

  return { timeData, bestTimes, heatmapData, loading, refresh: () => {} };
}
