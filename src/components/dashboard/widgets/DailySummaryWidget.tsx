import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, MessageSquare, Target, DollarSign,
  Building2, Users, CheckCircle2, Clock,
} from 'lucide-react';
import { useDailySummary } from '@/hooks/useDailySummary';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface MetricRowProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  highlight?: boolean;
}

const MetricRow = React.memo(function MetricRow({ icon: Icon, label, value, highlight }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${highlight ? 'text-success' : ''}`} />
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-success' : ''}`}>{value}</span>
    </div>
  );
});

export const DailySummaryWidget = React.memo(function DailySummaryWidget() {
  const { data, isLoading, error } = useDailySummary();

  if (error) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Resumo do Dia
          <Badge variant="outline" className="text-[10px] ml-auto">Hoje</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">
        <MetricRow icon={MessageSquare} label="Interações" value={data.interactions_count} />
        <MetricRow icon={Target} label="Deals Criados" value={data.deals_created} />
        <MetricRow icon={Target} label="Deals Ganhos" value={data.deals_won} highlight={data.deals_won > 0} />
        <MetricRow icon={DollarSign} label="Receita" value={formatCurrency(data.revenue)} highlight={data.revenue > 0} />
        <MetricRow icon={Building2} label="Novas Empresas" value={data.new_companies} />
        <MetricRow icon={Users} label="Novos Contatos" value={data.new_contacts} />
        <MetricRow icon={CheckCircle2} label="Follow-ups Feitos" value={data.followups_completed} />
        <MetricRow icon={Clock} label="Follow-ups Pendentes" value={data.followups_pending} highlight={data.followups_pending > 3} />
      </CardContent>
    </Card>
  );
});
