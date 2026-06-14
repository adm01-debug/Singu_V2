import { BarChart3, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRFMSegmentConfig } from '@/hooks/useRFMSegmentConfig';

export function RFMSegmentDashboard() {
  const { segments, metrics, loading } = useRFMSegmentConfig();

  if (loading) return null;
  if (!metrics && segments.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Metrics Overview */}
      {metrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Métricas RFM Consolidadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Contatos Analisados</p>
                <p className="text-xl font-bold text-foreground">{metrics.total_contacts_analyzed || 0}</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Score RFM Médio</p>
                <p className="text-xl font-bold text-primary">{Number(metrics.average_rfm_score || 0).toFixed(1)}</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold text-success">
                  R$ {Number(metrics.total_revenue || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {Number(metrics.average_monetary_value || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Segment Distribution */}
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Distribuição por Segmento</p>
              {[
                { label: 'Campeões', value: metrics.champions_count, color: 'bg-success' },
                { label: 'Leais', value: metrics.loyal_count, color: 'bg-primary' },
                { label: 'Potenciais Leais', value: metrics.potential_loyalist_count, color: 'bg-info' },
                { label: 'Novos', value: metrics.recent_customers_count, color: 'bg-accent' },
                { label: 'Promissores', value: metrics.promising_count, color: 'bg-warning' },
                { label: 'Atenção', value: metrics.needing_attention_count, color: 'bg-warning' },
                { label: 'Adormecendo', value: metrics.about_to_sleep_count, color: 'bg-muted-foreground' },
                { label: 'Em Risco', value: metrics.at_risk_count, color: 'bg-destructive' },
                { label: 'Não Perder', value: metrics.cant_lose_count, color: 'bg-destructive' },
                { label: 'Hibernando', value: metrics.hibernating_count, color: 'bg-muted' },
                { label: 'Perdidos', value: metrics.lost_count, color: 'bg-muted' },
              ].filter(s => (s.value || 0) > 0).map(s => {
                const total = metrics.total_contacts_analyzed || 1;
                const pct = ((s.value || 0) / total) * 100;
                return (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-28 text-xs text-muted-foreground">{s.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-foreground">{s.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segment Config */}
      {segments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuração de Segmentos ({segments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {segments.map(seg => (
                <div key={seg.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    {seg.color && (
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    )}
                    <span className="font-medium text-foreground">{seg.segment_name}</span>
                  </div>
                  {seg.description && (
                    <p className="text-xs text-muted-foreground mt-1">{seg.description}</p>
                  )}
                  <div className="flex gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span>R: {seg.recency_min}-{seg.recency_max}</span>
                    <span>F: {seg.frequency_min}-{seg.frequency_max}</span>
                    <span>M: {seg.monetary_min}-{seg.monetary_max}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
