import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HeatmapCell {
  dayOfWeek: number; // 0=Dom..6=Sáb
  hour: number; // 6..22
  attempts: number;
  responses: number;
  responseRate: number; // 0..1
}

export interface TopSlot {
  dayOfWeek: number;
  hour: number;
  dayLabel: string;
  hourLabel: string;
  responseRate: number;
  attempts: number;
  responses: number;
}

export interface BestTimeHeatmapResult {
  cells: HeatmapCell[];
  topSlots: TopSlot[];
  totalAttempts: number;
  totalResponses: number;
  hasEnoughData: boolean;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MIN_ATTEMPTS_TOTAL = 20;
const MIN_ATTEMPTS_PER_SLOT = 5;
const RESPONSE_WINDOW_MS = 48 * 60 * 60 * 1000;
const HOUR_START = 6;
const HOUR_END = 22;

interface InteractionRow {
  id: string;
  contact_id: string | null;
  initiated_by: string | null;
  created_at: string;
}

function buildEmpty(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      cells.push({ dayOfWeek: d, hour: h, attempts: 0, responses: 0, responseRate: 0 });
    }
  }
  return cells;
}

export function useBestTimeHeatmap() {
  const { user } = useAuth();

  const query = useQuery<BestTimeHeatmapResult>({
    queryKey: ['best-time-heatmap', user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('interactions')
        .select('id, contact_id, initiated_by, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;

      const rows = (data || []) as unknown as InteractionRow[];
      const outbound = rows.filter(r => r.initiated_by === 'us' && r.contact_id);
      const inboundByContact = new Map<string, number[]>();
      rows
        .filter(r => r.initiated_by === 'them' && r.contact_id)
        .forEach(r => {
          const arr = inboundByContact.get(r.contact_id!) || [];
          arr.push(new Date(r.created_at).getTime());
          inboundByContact.set(r.contact_id!, arr);
        });

      const cells = buildEmpty();
      const idx = (d: number, h: number) => d * (HOUR_END - HOUR_START + 1) + (h - HOUR_START);

      let totalAttempts = 0;
      let totalResponses = 0;

      for (const o of outbound) {
        const t = new Date(o.created_at);
        const h = t.getHours();
        if (h < HOUR_START || h > HOUR_END) continue;
        const d = t.getDay();
        const cell = cells[idx(d, h)];
        cell.attempts++;
        totalAttempts++;
        const ts = t.getTime();
        const inbounds = inboundByContact.get(o.contact_id!) || [];
        const responded = inbounds.some(it => it > ts && it - ts <= RESPONSE_WINDOW_MS);
        if (responded) {
          cell.responses++;
          totalResponses++;
        }
      }

      cells.forEach(c => {
        c.responseRate = c.attempts > 0 ? c.responses / c.attempts : 0;
      });

      const topSlots: TopSlot[] = cells
        .filter(c => c.attempts >= MIN_ATTEMPTS_PER_SLOT)
        .sort((a, b) => b.responseRate - a.responseRate || b.attempts - a.attempts)
        .slice(0, 3)
        .map(c => ({
          dayOfWeek: c.dayOfWeek,
          hour: c.hour,
          dayLabel: DAY_LABELS[c.dayOfWeek],
          hourLabel: `${c.hour}h`,
          responseRate: c.responseRate,
          attempts: c.attempts,
          responses: c.responses,
        }));

      return {
        cells,
        topSlots,
        totalAttempts,
        totalResponses,
        hasEnoughData: totalAttempts >= MIN_ATTEMPTS_TOTAL,
      };
    },
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export const HEATMAP_CONSTANTS = {
  DAY_LABELS,
  HOUR_START,
  HOUR_END,
  MIN_ATTEMPTS_TOTAL,
  MIN_ATTEMPTS_PER_SLOT,
};
