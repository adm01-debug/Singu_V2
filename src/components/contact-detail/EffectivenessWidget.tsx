import { BarChart3, DollarSign, Clock, Zap, MessageSquare, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactEffectiveness } from '@/hooks/useContactEffectiveness';

interface Props { contactId: string; }

export function EffectivenessWidget({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useContactEffectiveness(contactId);

  return (
    <ExternalDataCard
      title="Efetividade"
      icon={<Zap className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!data}
      emptyMessage="Dados insuficientes para análise de efetividade"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Efetividade Comercial
            </span>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {data?.overall_score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={data?.overall_score || 0} className="h-2" />

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Conversão</span>
              <span className="ml-auto font-medium tabular-nums">{((data?.conversion_rate || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Ticket médio</span>
              <span className="ml-auto font-medium tabular-nums">
                {(data?.avg_deal_size || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Ciclo</span>
              <span className="ml-auto font-medium tabular-nums">{data?.avg_sales_cycle_days || 0}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Resposta</span>
              <span className="ml-auto font-medium tabular-nums">{((data?.response_rate || 0) * 100).toFixed(0)}%</span>
            </div>
          </div>

          {data?.best_channel && (
            <p className="text-[10px] text-muted-foreground">
              Melhor canal: <span className="font-medium text-foreground capitalize">{data.best_channel}</span>
              {data.best_time_slot && <> · Horário: <span className="font-medium text-foreground">{data.best_time_slot}</span></>}
            </p>
          )}

          {data?.recommendations && data.recommendations.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border/50">
              {data.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px]">
                  <Lightbulb className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
