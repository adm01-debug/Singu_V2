import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Target, Crown } from 'lucide-react';
import { useStrategicAccounts } from '@/hooks/useCompanyIntelligence';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

function healthColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export const StrategicAccountsWidget = React.memo(function StrategicAccountsWidget() {
  const { data: accounts, isLoading, error } = useStrategicAccounts();

  if (error) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Contas Estratégicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma conta estratégica identificada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Crown className="h-4 w-4 text-warning" />
          Contas Estratégicas
          <Badge variant="outline" className="text-[10px] ml-auto">{accounts.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Empresas de maior valor e importância</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {accounts.map((account: Record<string, unknown>, idx: number) => {
            const name = (account.company_name || account.name || 'Empresa') as string;
            const revenue = (account.total_revenue || account.revenue || 0) as number;
            const health = (account.health_score || 0) as number;
            const deals = (account.active_deals || account.deals_count || 0) as number;

            return (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {deals > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Target className="h-3 w-3" /> {deals} deals
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {revenue > 0 && (
                    <span className="text-xs font-semibold">{formatCurrency(revenue)}</span>
                  )}
                  {health > 0 && (
                    <Badge variant="outline" className={cn('text-[10px]', healthColor(health))}>
                      {health}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default StrategicAccountsWidget;
