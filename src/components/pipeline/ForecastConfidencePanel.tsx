import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { useDealsPipeline, type PipelineDeal } from '@/hooks/usePipeline';

const STAGE_PROBABILITY: Record<string, number> = {
  lead: 10,
  primeiro_contato: 20,
  qualificacao: 30,
  proposta: 50,
  negociacao: 70,
  fechamento: 90,
};

const STAGE_BENCHMARK: Record<string, number> = {
  lead: 7,
  primeiro_contato: 7,
  qualificacao: 14,
  proposta: 10,
  negociacao: 21,
  fechamento: 14,
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

const sentimentValue = (s: string | null): number => {
  if (!s) return 0;
  const v = s.toLowerCase();
  if (v === 'positive' || v === 'positivo') return 1;
  if (v === 'negative' || v === 'negativo') return -1;
  return 0;
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);

interface InteractionRow {
  contact_id: string;
  sentiment: string | null;
  created_at: string;
  initiated_by: string | null;
}

interface Bucket {
  label: string;
  total: number;
  count: number;
  className: string;
  barClassName: string;
}

function computeConfidence(
  deal: PipelineDeal,
  list: InteractionRow[],
): number {
  const stage = deal.pipeline_stage || 'lead';
  const stageProb = STAGE_PROBABILITY[stage] ?? 20;
  const benchmark = STAGE_BENCHMARK[stage] ?? 14;

  const daysInStage = deal.dias_no_estagio_atual ?? 0;
  const stagnation = clamp(((daysInStage / benchmark - 1) / 2) * 100);
  const recent5 = list.slice(0, 5);
  const avgSent = recent5.length
    ? recent5.reduce((a, b) => a + sentimentValue(b.sentiment), 0) / recent5.length
    : 0;
  const sentimentScore = clamp(((-avgSent + 1) / 2) * 100);
  const inbound = list.find((r) => {
    const v = (r.initiated_by ?? '').toLowerCase();
    return v === 'contact' || v === 'cliente' || v === 'inbound';
  });
  const daysSince = inbound
    ? Math.floor((Date.now() - new Date(inbound.created_at).getTime()) / 86400000)
    : 60;
  const engagement = clamp((daysSince / 30) * 100);
  const totalAge = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / 86400000)
    : 0;
  const ageScore = clamp((totalAge / 60 - 0.5) * 100);
  const slip =
    stagnation * 0.4 + sentimentScore * 0.25 + engagement * 0.25 + ageScore * 0.1;

  const cutoff = Date.now() - 14 * 86400000;
  let recent = 0;
  let previous = 0;
  list.forEach((r) => {
    const t = new Date(r.created_at).getTime();
    if (t >= cutoff) recent += 1;
    else previous += 1;
  });
  let momentumScore: number;
  if (recent === 0 && previous === 0) momentumScore = 30;
  else if (previous === 0) momentumScore = clamp(60 + recent * 8);
  else momentumScore = clamp((recent / previous) * 50);

  const ageRatio = totalAge / 60;
  const velocityScore =
    ageRatio <= 1 ? clamp(100 - ageRatio * 30) : clamp(70 - (ageRatio - 1) * 60);

  return Math.round(
    stageProb * 0.35 +
      (100 - slip) * 0.3 +
      momentumScore * 0.2 +
      velocityScore * 0.15,
  );
}

export function ForecastConfidencePanel() {
  const { data: deals } = useDealsPipeline();

  const openDeals = useMemo(
    () =>
      (deals ?? []).filter(
        (d) => d.status !== 'ganho' && d.status !== 'perdido',
      ),
    [deals],
  );

  const contactIds = useMemo(
    () =>
      Array.from(
        new Set(
          openDeals.map((d) => d.contact_id).filter(Boolean) as string[],
        ),
      ),
    [openDeals],
  );

  const { data: interactions } = useQuery<InteractionRow[]>({
    queryKey: ['forecast-confidence-interactions', contactIds.join(',')],
    enabled: contactIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const { data } = await supabase
        .from('interactions')
        .select('contact_id, sentiment, created_at, initiated_by')
        .in('contact_id', contactIds)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      return (data ?? []) as InteractionRow[];
    },
  });

  const buckets = useMemo<Bucket[]>(() => {
    const byContact = new Map<string, InteractionRow[]>();
    (interactions ?? []).forEach((row) => {
      const list = byContact.get(row.contact_id) ?? [];
      list.push(row);
      byContact.set(row.contact_id, list);
    });

    const result: Record<'high' | 'medium' | 'low', Bucket> = {
      high: {
        label: 'Alta confiança',
        total: 0,
        count: 0,
        className: 'text-success',
        barClassName: 'bg-success',
      },
      medium: {
        label: 'Média confiança',
        total: 0,
        count: 0,
        className: 'text-info',
        barClassName: 'bg-info',
      },
      low: {
        label: 'Baixa confiança',
        total: 0,
        count: 0,
        className: 'text-muted-foreground',
        barClassName: 'bg-muted-foreground',
      },
    };

    openDeals.forEach((deal) => {
      const list = (deal.contact_id && byContact.get(deal.contact_id)) || [];
      const conf = computeConfidence(deal, list);
      const expected = (deal.valor || 0) * (conf / 100);
      const key: 'high' | 'medium' | 'low' =
        conf >= 71 ? 'high' : conf >= 41 ? 'medium' : 'low';
      result[key].total += expected;
      result[key].count += 1;
    });

    return [result.high, result.medium, result.low];
  }, [openDeals, interactions]);

  const grandTotal = buckets.reduce((a, b) => a + b.total, 0);

  if (openDeals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Forecast Ponderado por Confiança
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            Total esperado: <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {buckets.map((b) => {
          const pct = grandTotal > 0 ? (b.total / grandTotal) * 100 : 0;
          return (
            <div key={b.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={b.className}>
                  {b.label} <span className="text-muted-foreground">({b.count} deals)</span>
                </span>
                <span className="font-semibold">{formatCurrency(b.total)}</span>
              </div>
              <Progress
                value={pct}
                className="h-1.5"
                indicatorClassName={b.barClassName}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
