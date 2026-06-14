import { BarChart3, Layers, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTriggerAnalytics } from '@/hooks/useTriggerAnalytics';

export function TriggerAnalyticsPanel() {
  const { abTests, channelEffectiveness, bundles, loading } = useTriggerAnalytics();

  if (loading) return null;

  const hasData = abTests.length > 0 || channelEffectiveness.length > 0 || bundles.length > 0;
  if (!hasData) return null;

  return (
    <div className="space-y-4">
      {/* A/B Tests */}
      {abTests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FlaskConical className="h-4 w-4 text-primary" />
              Testes A/B de Gatilhos ({abTests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {abTests.slice(0, 5).map(test => {
              const aRate = (test.variant_a_uses ?? 0) > 0 ? ((test.variant_a_conversions ?? 0) / (test.variant_a_uses ?? 1)) * 100 : 0;
              const bRate = (test.variant_b_uses ?? 0) > 0 ? ((test.variant_b_conversions ?? 0) / (test.variant_b_uses ?? 1)) * 100 : 0;
              return (
                <div key={test.id} className="rounded-lg border p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{test.name}</span>
                    <div className="flex items-center gap-2">
                      {test.winner && (
                        <Badge className="text-xs bg-success text-success">Vencedor: {test.winner}</Badge>
                      )}
                      <Badge variant={test.is_active ? 'default' : 'secondary'} className="text-xs">
                        {test.is_active ? 'Ativo' : 'Concluído'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border p-2">
                      <p className="text-xs text-muted-foreground">Variante A: {test.variant_a_trigger}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={aRate} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-foreground">{aRate.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{test.variant_a_conversions}/{test.variant_a_uses} usos</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-xs text-muted-foreground">Variante B: {test.variant_b_trigger}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={bRate} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-foreground">{bRate.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{test.variant_b_conversions}/{test.variant_b_uses} usos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Channel Effectiveness */}
      {channelEffectiveness.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-info" />
              Eficácia por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Aggregate by channel */}
              {Object.entries(
                channelEffectiveness.reduce<Record<string, { uses: number; successes: number; score: number; count: number }>>((acc, item) => {
                  const ch = item.channel;
                  if (!acc[ch]) acc[ch] = { uses: 0, successes: 0, score: 0, count: 0 };
                  acc[ch].uses += item.uses ?? 0;
                  acc[ch].successes += item.successes ?? 0;
                  acc[ch].score += Number(item.effectiveness_score);
                  acc[ch].count += 1;
                  return acc;
                }, {})
              ).sort(([, a], [, b]) => (b.score / b.count) - (a.score / a.count))
                .map(([channel, data]) => {
                  const avgScore = data.count > 0 ? data.score / data.count : 0;
                  return (
                    <div key={channel} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <span className="w-24 text-sm font-medium capitalize text-foreground">{channel}</span>
                      <Progress value={avgScore} className="h-2 flex-1" />
                      <span className="w-12 text-right text-xs text-muted-foreground">{avgScore.toFixed(0)}%</span>
                      <span className="w-16 text-right text-xs text-muted-foreground">{data.successes}/{data.uses}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Bundles */}
      {bundles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-warning" />
              Bundles de Gatilhos ({bundles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bundles.slice(0, 6).map(b => (
              <div key={b.id} className="rounded-lg border p-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Number(b.success_rate).toFixed(0)}% sucesso
                    </Badge>
                    <span className="text-xs text-muted-foreground">{b.total_uses} usos</span>
                  </div>
                </div>
                {b.scenario && <p className="text-xs text-muted-foreground mt-1">{b.scenario}</p>}
                {b.triggers && (b.triggers as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(b.triggers as string[]).slice(0, 4).map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                {b.is_system_bundle && (
                  <Badge className="text-xs mt-1 bg-primary/10 text-primary">Sistema</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
