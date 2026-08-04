import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountPlan } from '@/hooks/useCompanyIntelligence';
import { Target, CheckCircle, Circle } from 'lucide-react';

export const AccountPlanWidget = React.memo(function AccountPlanWidget({ companyId }: { companyId: string }) {
  const { data, isLoading } = useAccountPlan(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Plano de Conta</CardTitle></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>;
  if (!data) return null;

  const plan = data as unknown as Record<string, unknown>;
  const objectives = (plan.objectives as Array<Record<string, unknown>>) || [];
  const strategies = (plan.strategies as string[]) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />Plano de Conta
          {plan.status && <Badge variant="outline" className="text-[10px] ml-auto capitalize">{String(plan.status)}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.goal && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Objetivo Principal</p>
            <p className="text-xs mt-0.5">{String(plan.goal)}</p>
          </div>
        )}
        {objectives.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Objetivos</p>
            {objectives.slice(0, 4).map((obj, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {obj.completed ? <CheckCircle className="h-3 w-3 text-success shrink-0" /> : <Circle className="h-3 w-3 text-muted-foreground shrink-0" />}
                <span className="truncate">{String(obj.title || obj.name || '')}</span>
              </div>
            ))}
          </div>
        )}
        {strategies.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Estratégias</p>
            <div className="flex flex-wrap gap-1">{strategies.slice(0, 4).map((s, i) => <Badge key={i} variant="outline" className="text-[9px]">{s}</Badge>)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default AccountPlanWidget;
