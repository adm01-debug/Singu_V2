import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Target, MessageSquare, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { useInstantKpis } from '@/hooks/useInstantKpis';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const kpiConfig = [
  { key: 'open_deals_value' as const, label: 'Pipeline Aberto', icon: DollarSign, format: 'currency' as const, warn: false },
  { key: 'revenue_month' as const, label: 'Receita Mês', icon: TrendingUp, format: 'currency' as const, warn: false },
  { key: 'deals_won_month' as const, label: 'Deals Ganhos', icon: Target, format: 'number' as const, warn: false },
  { key: 'interactions_today' as const, label: 'Interações Hoje', icon: MessageSquare, format: 'number' as const, warn: false },
  { key: 'pending_followups' as const, label: 'Follow-ups', icon: Clock, format: 'number' as const, warn: false },
  { key: 'overdue_tasks' as const, label: 'Atrasados', icon: AlertTriangle, format: 'number' as const, warn: true },
];

export const ExecutiveKpisWidget = React.memo(function ExecutiveKpisWidget() {
  const { data: kpis, isLoading, error } = useInstantKpis();

  if (error) return null; // Silently degrade — other widgets cover basics
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">KPIs Executivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          KPIs Executivos
          <Badge variant="outline" className="text-[10px] ml-auto">Tempo Real</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpiConfig.map(({ key, label, icon: Icon, format, warn }) => {
            const value = kpis[key] ?? 0;
            const isWarn = warn && value > 0;
            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${isWarn ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}
              >
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Icon className={`h-3.5 w-3.5 ${isWarn ? 'text-destructive' : ''}`} />
                  <span className="text-[11px] font-medium">{label}</span>
                </div>
                <p className={`text-lg font-bold ${isWarn ? 'text-destructive' : ''}`}>
                  {format === 'currency' ? formatCurrency(value) : value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
