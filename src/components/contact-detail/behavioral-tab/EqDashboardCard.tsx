import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

interface EqDashboardRow {
  contact_id: string;
  contact_name?: string;
  latest_score?: number;
  latest_level?: string;
  analysis_count?: number;
  avg_score?: number;
  max_score?: number;
  min_score?: number;
  score_trend?: string;
  top_strengths?: string[];
  top_growth_areas?: string[];
  last_analyzed_at?: string;
}

interface Props {
  contactId: string;
}

export function EqDashboardCard({ contactId }: Props) {
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
        <CardContent>
          <InlineEmptyState
            icon={BarChart3}
            title="Sem dados de EQ"
            description="Dados serão exibidos após análises de inteligência emocional"
          />
        </CardContent>
      </Card>
    );
  }

  const trendLabel: Record<string, string> = {
    improving: '📈 Melhorando',
    declining: '📉 Declinando',
    stable: '➡️ Estável',
  };

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
            <span className="text-xl font-bold text-primary">{data.latest_score ?? '—'}</span>
          </div>
          <div className="flex-1 space-y-1">
            {data.latest_level && (
              <Badge variant="secondary" className="text-xs capitalize">{data.latest_level}</Badge>
            )}
            {data.score_trend && (
              <p className="text-xs text-muted-foreground">{trendLabel[data.score_trend] || data.score_trend}</p>
            )}
            <p className="text-xs text-muted-foreground">{data.analysis_count ?? 0} análises realizadas</p>
          </div>
        </div>

        {(data.avg_score || data.min_score || data.max_score) && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-semibold text-foreground">{data.min_score ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Mínimo</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-semibold text-foreground">{data.avg_score ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Média</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-semibold text-foreground">{data.max_score ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Máximo</p>
            </div>
          </div>
        )}

        {data.top_strengths && data.top_strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Forças Principais</p>
            <div className="flex flex-wrap gap-1">
              {data.top_strengths.slice(0, 5).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.top_growth_areas && data.top_growth_areas.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Áreas de Crescimento</p>
            <div className="flex flex-wrap gap-1">
              {data.top_growth_areas.slice(0, 5).map((a) => (
                <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.last_analyzed_at && (
          <p className="text-[10px] text-muted-foreground/70 text-right">
            Última análise: {new Date(data.last_analyzed_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
