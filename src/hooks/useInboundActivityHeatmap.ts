import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type InboundChannel = 'all' | 'whatsapp' | 'email' | 'call';

export interface InboundCell {
  dayOfWeek: number;
  hour: number;
  count: number;
  intensity: number; // 0..1 relativo ao max
}

export interface InboundPeak {
  dayOfWeek: number;
  hour: number;
  dayLabel: string;
  hourLabel: string;
  count: number;
}

export interface InboundHeatmapResult {
  cells: InboundCell[];
  peaks: InboundPeak[];
  total: number;
  topDay: { index: number; label: string; count: number } | null;
  topHour: { hour: number; label: string; count: number } | null;
  hasEnoughData: boolean;
  byChannel: Record<string, number>;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_START = 6;
const HOUR_END = 22;
const MIN_TOTAL = 10;

interface InboundRow {
  id: string;
  tipo: string | null;
  created_at: string;
}

function buildEmpty(): InboundCell[] {
  const cells: InboundCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      cells.push({ dayOfWeek: d, hour: h, count: 0, intensity: 0 });
    }
  }
  return cells;
}

function normalizeChannel(tipo: string | null): string {
  if (!tipo) return 'outros';
  const t = tipo.toLowerCase();
  if (t.includes('whats')) return 'whatsapp';
  if (t.includes('mail')) return 'email';
  if (t.includes('call') || t.includes('lig') || t.includes('telefone') || t.includes('voip')) return 'call';
  return 'outros';
}

export function useInboundActivityHeatmap(channel: InboundChannel = 'all') {
  const { user } = useAuth();

  const query = useQuery<InboundHeatmapResult>({
    queryKey: ['inbound-activity-heatmap', user?.id, channel],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('interactions')
        .select('id, tipo, created_at')
        .eq('user_id', user!.id)
        .eq('initiated_by', 'them')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;

      const rows = (data || []) as unknown as InboundRow[];
      const filtered = channel === 'all'
        ? rows
        : rows.filter(r => normalizeChannel(r.tipo) === channel);

      const cells = buildEmpty();
      const idx = (d: number, h: number) => d * (HOUR_END - HOUR_START + 1) + (h - HOUR_START);
      const dayTotals = new Array(7).fill(0);
      const hourTotals = new Map<number, number>();
      const byChannel: Record<string, number> = { whatsapp: 0, email: 0, call: 0, outros: 0 };

      let total = 0;
      let max = 0;

      for (const row of filtered) {
        const t = new Date(row.created_at);
        const h = t.getHours();
        const d = t.getDay();
        byChannel[normalizeChannel(row.tipo)]++;
        if (h < HOUR_START || h > HOUR_END) continue;
        const c = cells[idx(d, h)];
        c.count++;
        total++;
        dayTotals[d]++;
        hourTotals.set(h, (hourTotals.get(h) || 0) + 1);
        if (c.count > max) max = c.count;
      }

      cells.forEach(c => {
        c.intensity = max > 0 ? c.count / max : 0;
      });

      const peaks: InboundPeak[] = [...cells]
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(c => ({
          dayOfWeek: c.dayOfWeek,
          hour: c.hour,
          dayLabel: DAY_LABELS[c.dayOfWeek],
          hourLabel: `${c.hour}h`,
          count: c.count,
        }));

      let topDayIdx = -1;
      let topDayCount = 0;
      dayTotals.forEach((v, i) => {
        if (v > topDayCount) { topDayCount = v; topDayIdx = i; }
      });

      let topHour = -1;
      let topHourCount = 0;
      hourTotals.forEach((v, h) => {
        if (v > topHourCount) { topHourCount = v; topHour = h; }
      });

      return {
        cells,
        peaks,
        total,
        topDay: topDayIdx >= 0 ? { index: topDayIdx, label: DAY_LABELS[topDayIdx], count: topDayCount } : null,
        topHour: topHour >= 0 ? { hour: topHour, label: `${topHour}h`, count: topHourCount } : null,
        hasEnoughData: total >= MIN_TOTAL,
        byChannel,
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

export const INBOUND_HEATMAP_CONSTANTS = {
  DAY_LABELS,
  HOUR_START,
  HOUR_END,
  MIN_TOTAL,
};
