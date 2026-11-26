import { BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';

interface EqDashboardRow {
  contact_id: string | null;
  contact_name: string | null;
  company_name: string | null;
  eq_score: number | null;
  eq_level: string | null;
  communication_style: string | null;
  emotional_trend: string | null;
  avg_sentiment_score: number | null;
  closing_timing: string | null;
  closing_readiness: number | null;
  disc_type: string | null;
  relationship_score: number | null;
  action_summary: string | null;
}

interface Props {
  contactId: string;
}

export function EqDashboardCard({ contactId }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vw-eq-dashboard', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<EqDashboardRow>({
        table: 'vw_eq_dashboard',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return Array.isArray(data) ? data[0] || null : data;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  const recalculate = useMutation({
    mutationFn: async () => {
      const score = await callExternalRpc('calculate_eq_score', { p_contact_id: contactId });
      if (score.error) throw score.error;
      const trend = await callExternalRpc('calculate_emotional_trend', {
        p_contact_id: contactId,
        p_period_days: 30,
      });
      if (trend.error) throw trend.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vw-eq-dashboard', contactId] });
      queryClient.invalidateQueries({ queryKey: ['eq-evolution', contactId] });
      toast.success('Análise de EQ atualizada');
    },
    onError: (error) => {
      toast.error('Não foi possível atualizar a análise', {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  const recalculateButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => recalculate.mutate()}
      disabled={recalculate.isPending}
    >
      <RefreshCw className={recalculate.isPending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
      {recalculate.isPending ? 'Analisando…' : 'Recalcular análise'}
    </Button>
  );

  if (isLoading) return null;

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Dashboard EQ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InlineEmptyState
            icon={BarChart3}
            title="Sem dados de EQ"
            description="Gere a análise de inteligência emocional deste contato"
          />
          <div className="flex justify-center">{recalculateButton}</div>
        </CardContent>
      </Card>
    );
  }

  const trendLabel: Record<string, string> = {
    improving: '📈 Melhorando',
    declining: '📉 Declinando',
    stable: '➡️ Estável',
  };

  const metric = (value: number | null, label: string) => (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p className="text-lg font-semibold text-foreground">{value ?? '—'}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-primary" />
          Dashboard EQ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20">
            <span className="text-xl font-bold text-primary">{data.eq_score ?? '—'}</span>
          </div>
          <div className="flex-1 space-y-1">
            {data.eq_level && (
              <Badge variant="secondary" className="text-xs capitalize">{data.eq_level}</Badge>
            )}
            {data.emotional_trend && (
              <p className="text-xs text-muted-foreground">
                {trendLabel[data.emotional_trend] || data.emotional_trend}
              </p>
            )}
            {data.communication_style && (
              <p className="text-xs text-muted-foreground capitalize">{data.communication_style}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {metric(data.relationship_score, 'Relacionamento')}
          {metric(data.closing_readiness, 'Prontidão')}
          {metric(data.avg_sentiment_score, 'Sentimento')}
        </div>

        {(data.disc_type || data.closing_timing) && (
          <div className="flex flex-wrap gap-1">
            {data.disc_type && (
              <Badge variant="outline" className="text-xs">DISC: {data.disc_type}</Badge>
            )}
            {data.closing_timing && (
              <Badge variant="outline" className="text-xs capitalize">{data.closing_timing}</Badge>
            )}
          </div>
        )}

        {data.action_summary && (
          <p className="rounded-lg bg-muted/50 p-2 text-xs text-foreground">{data.action_summary}</p>
        )}

        <div className="flex justify-end">{recalculateButton}</div>
      </CardContent>
    </Card>
  );
}