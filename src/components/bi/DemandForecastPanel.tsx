import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain, Sparkles } from 'lucide-react';
import { useDemandForecast, type DemandForecast } from '@/hooks/useBIAdvanced';

const trendIcon = (trend: string) => {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export const DemandForecastPanel = React.memo(function DemandForecastPanel() {
  const { mutate: generate, isPending, data } = useDemandForecast();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Previsão de Demanda (IA)
          </CardTitle>
          <CardDescription className="text-xs">
            Análise preditiva baseada em padrões históricos de interação
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Sparkles className="h-12 w-12 text-primary/30" />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Use IA para prever a demanda dos próximos 3 meses com base no histórico de interações.
          </p>
          <Button onClick={() => generate()} disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Gerar Previsão
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const forecast = data as DemandForecast;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Previsão de Demanda
            </CardTitle>
            <CardDescription className="text-xs">Próximos 3 meses via IA</CardDescription>
          </div>
          <div className="flex gap-2">
            {forecast.seasonality_detected && (
              <Badge variant="outline" className="text-xs">📊 Sazonalidade detectada</Badge>
            )}
            <Badge variant={forecast.growth_rate_percent >= 0 ? 'default' : 'destructive'} className="text-xs">
              {forecast.growth_rate_percent >= 0 ? '+' : ''}{forecast.growth_rate_percent.toFixed(1)}% crescimento
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Historical + Forecast Chart (simplified bar chart) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Histórico</p>
          <div className="flex items-end gap-1 h-24">
            {forecast.historical.slice(-6).map((h, i) => {
              const max = Math.max(...forecast.historical.map(x => x.interactions), ...forecast.forecast.map(x => x.predicted_interactions));
              const height = max > 0 ? (h.interactions / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{h.interactions}</span>
                  <div className="w-full rounded-t bg-primary/60" style={{ height: `${height}%`, minHeight: 4 }} />
                  <span className="text-[9px] text-muted-foreground">{h.month.slice(5)}</span>
                </div>
              );
            })}
            {/* Forecast bars */}
            {forecast.forecast.map((f, i) => {
              const max = Math.max(...forecast.historical.map(x => x.interactions), ...forecast.forecast.map(x => x.predicted_interactions));
              const height = max > 0 ? (f.predicted_interactions / max) * 100 : 0;
              return (
                <div key={`f-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-primary">{f.predicted_interactions}</span>
                  <div className="w-full rounded-t bg-primary/30 border-2 border-dashed border-primary/50" style={{ height: `${height}%`, minHeight: 4 }} />
                  <span className="text-[9px] font-medium text-primary">{f.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forecast Details */}
        <div className="grid grid-cols-3 gap-2">
          {forecast.forecast.map((f, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 p-3 text-center space-y-1">
              <p className="text-xs font-medium">{f.month}</p>
              <p className="text-lg font-bold">{f.predicted_interactions}</p>
              <div className="flex items-center justify-center gap-1">
                {trendIcon(f.trend)}
                <span className="text-[10px] text-muted-foreground">{(f.confidence * 100).toFixed(0)}% conf.</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        {forecast.insights?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Insights da IA
            </p>
            {forecast.insights.map((insight, i) => (
              <p key={i} className="text-xs text-muted-foreground pl-4 border-l-2 border-primary/30">
                {insight}
              </p>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => generate()} disabled={isPending} className="w-full gap-2">
          <Brain className="h-3 w-3" />
          Atualizar Previsão
        </Button>
      </CardContent>
    </Card>
  );
});

export default DemandForecastPanel;
