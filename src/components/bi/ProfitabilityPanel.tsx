import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Users, AlertTriangle } from 'lucide-react';
import { useProfitabilityByContact } from '@/hooks/useBIAdvanced';
import { cn } from '@/lib/utils';

function roiColor(score: number): string {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
}

function roiBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-warning';
  return 'bg-destructive';
}

export const ProfitabilityPanel = React.memo(function ProfitabilityPanel() {
  const { data, isLoading, error } = useProfitabilityByContact();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-warning" />
          <p className="text-sm">Erro ao carregar dados de rentabilidade.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  const items = data || [];
  const topPerformers = items.slice(0, 10);
  const avgROI = items.length > 0 ? items.reduce((a, b) => a + b.roi_score, 0) / items.length : 0;
  const highROI = items.filter(i => i.roi_score >= 70).length;
  const lowROI = items.filter(i => i.roi_score < 30).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Análise de Rentabilidade
            </CardTitle>
            <CardDescription className="text-xs">
              ROI por contato — baseado em relacionamento e engajamento
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">ROI Médio</p>
            <p className={cn('text-xl font-bold', roiColor(avgROI))}>{avgROI.toFixed(0)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Alto ROI</p>
            <p className="text-xl font-bold text-emerald-500">{highROI}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">Baixo ROI</p>
            <p className="text-xl font-bold text-destructive">{lowROI}</p>
          </div>
        </div>

        {/* Top 10 contacts by ROI */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Top 10 por Rentabilidade</p>
          {topPerformers.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <span className="text-xs font-bold text-muted-foreground w-5 text-right">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{item.interactions} interações</span>
                  <span>·</span>
                  <span>Sentimento: {item.avg_sentiment_score > 0 ? '+' : ''}{item.avg_sentiment_score}%</span>
                </div>
              </div>
              <div className="w-20">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn('text-xs font-bold', roiColor(item.roi_score))}>{item.roi_score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', roiBarColor(item.roi_score))} style={{ width: `${item.roi_score}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sem dados de rentabilidade disponíveis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default ProfitabilityPanel;
