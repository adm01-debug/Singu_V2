import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompleteDashboard } from '@/hooks/useCompleteDashboard';
import { Building2, Users, MessageSquare, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const kpis: Array<{ key: string; label: string; icon: typeof Building2; color: string; isCurrency?: boolean; isPercent?: boolean }> = [
  { key: 'total_companies', label: 'Empresas', icon: Building2, color: 'text-primary' },
  { key: 'total_contacts', label: 'Contatos', icon: Users, color: 'text-info' },
  { key: 'total_interactions', label: 'Interações', icon: MessageSquare, color: 'text-success' },
  { key: 'total_deals', label: 'Deals', icon: TrendingUp, color: 'text-warning' },
  { key: 'active_deals_value', label: 'Valor Ativo', icon: DollarSign, color: 'text-accent-foreground', isCurrency: true },
  { key: 'conversion_rate', label: 'Conversão', icon: BarChart3, color: 'text-primary', isPercent: true },
];

export const CompleteDashboardWidget = React.memo(function CompleteDashboardWidget() {
  const { data, isLoading } = useCompleteDashboard();

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Painel Executivo</CardTitle></CardHeader><CardContent><Skeleton className="h-24" /></CardContent></Card>;
  if (!data?.overview) return null;

  const overview = data.overview;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Painel Executivo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {kpis.map(({ key, label, icon: Icon, color, isCurrency, isPercent }) => {
            const value = (overview as Record<string, unknown>)[key] as number;
            const display = isCurrency
              ? `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
              : isPercent ? `${((value || 0)).toFixed(1)}%` : String(value ?? 0);
            return (
              <div key={key} className="rounded-lg bg-muted/30 p-2.5 text-center">
                <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
                <p className="text-sm font-bold">{display}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default CompleteDashboardWidget;
