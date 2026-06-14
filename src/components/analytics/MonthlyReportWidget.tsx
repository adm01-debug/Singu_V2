import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthlyReport } from '@/hooks/useReportsAnalytics';
import { FileText, DollarSign, Target, Users, MessageSquare } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export const MonthlyReportWidget = React.memo(function MonthlyReportWidget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data: report, isLoading, refetch } = useMonthlyReport(year, month);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Relatório Mensal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear(), now.getFullYear() - 1].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : report ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Receita', value: formatCurrency((report as Record<string, number>).revenue ?? 0), icon: DollarSign },
                { label: 'Deals Ganhos', value: (report as Record<string, number>).deals_won ?? 0, icon: Target },
                { label: 'Novos Contatos', value: (report as Record<string, number>).new_contacts ?? 0, icon: Users },
                { label: 'Interações', value: (report as Record<string, number>).interactions_count ?? 0, icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px]">{label}</span>
                  </div>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
            {(report as Record<string, string>).summary && (
              <p className="text-xs text-muted-foreground border-t pt-2">
                {(report as Record<string, string>).summary}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum dado para {MONTHS[month - 1]} {year}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export default MonthlyReportWidget;
