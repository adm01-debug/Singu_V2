import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TrendDirection = 'up' | 'stable' | 'down';

export interface SentimentPoint {
  weekStart: string; // ISO date (segunda-feira)
  label: string; // dd/MM
  avg: number; // -1..1
  smoothed: number; // média móvel
  count: number;
}

export interface SentimentStats {
  total: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  avg: number;
}

export interface SentimentTrendResult {
  points: SentimentPoint[];
  trend: { direction: TrendDirection; slope: number };
  stats: SentimentStats;
}

const sentimentToValue = (s: string | null): number | null => {
  if (!s) return null;
  const v = s.toLowerCase();
  if (v === 'positive' || v === 'positivo') return 1;
  if (v === 'negative' || v === 'negativo') return -1;
  if (v === 'neutral' || v === 'neutro') return 0;
  return null;
};

const startOfWeek = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // segunda-feira
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatLabel = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const linearSlope = (values: number[]): number => {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
};

export function useContactSentimentTrend(contactId: string | undefined) {
  const { user } = useAuth();
  return useQuery<SentimentTrendResult>({
    queryKey: ['contact-sentiment-trend', user?.id, contactId],
    enabled: !!contactId && !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);

      const { data, error } = await supabase
        .from('interactions')
        .select('sentiment, created_at')
        .eq('contact_id', contactId!)
        .eq('user_id', user!.id)
        .gte('created_at', since.toISOString())
        .not('sentiment', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1000);

      if (error) throw error;

      const rows = (data ?? [])
        .map((r) => ({ value: sentimentToValue(r.sentiment), at: r.created_at }))
        .filter((r): r is { value: number; at: string } => r.value !== null);

      const total = rows.length;
      const positives = rows.filter((r) => r.value > 0).length;
      const neutrals = rows.filter((r) => r.value === 0).length;
      const negatives = rows.filter((r) => r.value < 0).length;
      const avg = total > 0 ? rows.reduce((a, b) => a + b.value, 0) / total : 0;

      // Agrupar por semana
      const weekMap = new Map<string, { sum: number; count: number }>();
      for (const r of rows) {
        const key = startOfWeek(new Date(r.at)).toISOString().slice(0, 10);
        const cur = weekMap.get(key) ?? { sum: 0, count: 0 };
        cur.sum += r.value;
        cur.count += 1;
        weekMap.set(key, cur);
      }

      const ordered = Array.from(weekMap.entries())
        .map(([weekStart, v]) => ({ weekStart, avg: v.sum / v.count, count: v.count }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

      // Média móvel 3
      const points: SentimentPoint[] = ordered.map((p, i) => {
        const window = ordered.slice(Math.max(0, i - 2), i + 1);
        const smoothed = window.reduce((a, b) => a + b.avg, 0) / window.length;
        return {
          weekStart: p.weekStart,
          label: formatLabel(p.weekStart),
          avg: Number(p.avg.toFixed(3)),
          smoothed: Number(smoothed.toFixed(3)),
          count: p.count,
        };
      });

      const tail = points.slice(-6).map((p) => p.smoothed);
      const slope = linearSlope(tail);
      const direction: TrendDirection = slope > 0.05 ? 'up' : slope < -0.05 ? 'down' : 'stable';

      return {
        points,
        trend: { direction, slope: Number(slope.toFixed(3)) },
        stats: {
          total,
          positivePct: total > 0 ? Math.round((positives / total) * 100) : 0,
          neutralPct: total > 0 ? Math.round((neutrals / total) * 100) : 0,
          negativePct: total > 0 ? Math.round((negatives / total) * 100) : 0,
          avg: Number(avg.toFixed(2)),
        },
      };
    },
  });
}
