import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyKpis } from '@/hooks/useDailyKpis';
import { Building2, Users, UserCheck, DollarSign, MessageSquare, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const metrics: Array<{ key: string; label: string; icon: typeof Building2; color: string; isCurrency?: boolean }> = [
  { key: 'total_companies', label: 'Empresas', icon: Building2, color: 'text-primary' },
  { key: 'total_contacts', label: 'Contatos', icon: Users, color: 'text-info' },
  { key: 'active_customers', label: 'Clientes Ativos', icon: UserCheck, color: 'text-success' },
  { key: 'total_revenue', label: 'Receita', icon: DollarSign, color: 'text-warning', isCurrency: true },
  { key: 'interactions_today', label: 'Interações Hoje', icon: MessageSquare, color: 'text-primary' },
  { key: 'total_salespeople', label: 'Vendedores', icon: Briefcase, color: 'text-accent-foreground' },
];

export const DailyKpisWidget = React.memo(function DailyKpisWidget() {
  const { data, isLoading } = useDailyKpis();

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">KPIs Diários</CardTitle></CardHeader><CardContent><Skeleton className="h-24" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          📊 KPIs Diários
          {data.snapshot_date && <span className="text-[10px] text-muted-foreground ml-auto font-normal">{data.snapshot_date}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(({ key, label, icon: Icon, color, isCurrency }) => {
            const value = (data as Record<string, unknown>)[key] as number | undefined;
            const display = isCurrency ? `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : String(value ?? 0);
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

export default DailyKpisWidget;
