import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyStatistics } from '@/hooks/useCompanyIntelligence';
import { BarChart3, Users, MessageSquare, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats: Array<{ key: string; label: string; icon: typeof BarChart3; color: string; isCurrency?: boolean }> = [
  { key: 'total_contacts', label: 'Contatos', icon: Users, color: 'text-info' },
  { key: 'total_interactions', label: 'Interações', icon: MessageSquare, color: 'text-primary' },
  { key: 'total_deals', label: 'Deals', icon: TrendingUp, color: 'text-warning' },
  { key: 'total_revenue', label: 'Receita', icon: DollarSign, color: 'text-success', isCurrency: true },
  { key: 'avg_deal_cycle', label: 'Ciclo Médio (d)', icon: Clock, color: 'text-muted-foreground' },
  { key: 'conversion_rate', label: 'Conversão', icon: BarChart3, color: 'text-primary' },
];

export const CompanyStatisticsWidget = React.memo(function CompanyStatisticsWidget({ companyId }: { companyId: string }) {
  const { data, isLoading } = useCompanyStatistics(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Estatísticas</CardTitle></CardHeader><CardContent><Skeleton className="h-24" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Estatísticas da Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ key, label, icon: Icon, color, isCurrency }) => {
            const value = (data as unknown as Record<string, unknown>)[key] as number | undefined;
            const display = isCurrency ? `R$ ${(value || 0).toLocaleString('pt-BR')}` : String(value ?? '-');
            return (
              <div key={key} className="rounded-lg bg-muted/30 p-2 text-center">
                <Icon className={cn("h-3.5 w-3.5 mx-auto mb-0.5", color)} />
                <p className="text-xs font-bold tabular-nums">{display}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default CompanyStatisticsWidget;
