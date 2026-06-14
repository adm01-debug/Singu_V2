import { BarChart3, Users, Calendar, FileText, CheckSquare, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactStatistics } from '@/hooks/useContactStatistics';
import { cn } from '@/lib/utils';

interface Props { contactId: string; }

export function ContactStatisticsWidget({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useContactStatistics(contactId);

  return (
    <ExternalDataCard
      title="Estatísticas"
      icon={<BarChart3 className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!data}
      emptyMessage="Sem dados estatísticos disponíveis"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-primary" />
            Estatísticas do Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock icon={Users} label="Interações" value={data?.total_interactions ?? 0} />
            <StatBlock icon={DollarSign} label="Negócios" value={data?.total_deals ?? 0} />
            <StatBlock icon={Calendar} label="Reuniões" value={data?.total_meetings ?? 0} />
            <StatBlock icon={FileText} label="Propostas" value={data?.total_proposals ?? 0} />
            <StatBlock icon={CheckSquare} label="Tarefas" value={data?.total_tasks ?? 0} />
            <StatBlock
              icon={Clock}
              label="Sem contato"
              value={data?.days_since_last_contact != null ? `${data.days_since_last_contact}d` : '—'}
              warn={data?.days_since_last_contact != null && data.days_since_last_contact > 30}
            />
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-xs">
            <div>
              <span className="text-muted-foreground">Deals abertos: </span>
              <span className="font-medium tabular-nums">
                {(data?.open_deals_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ganhos: </span>
              <span className="font-medium text-green-600 tabular-nums">
                {(data?.won_deals_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {data?.nps_score != null && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">NPS:</span>
              <Badge variant="outline" className={cn('text-[10px] tabular-nums', data.nps_score >= 9 ? 'border-green-500/30 text-green-700' : data.nps_score >= 7 ? 'border-yellow-500/30 text-yellow-700' : 'border-red-500/30 text-red-700')}>
                {data.nps_score}
              </Badge>
              {data.churn_risk && (
                <>
                  <span className="text-muted-foreground">Risco:</span>
                  <Badge variant="outline" className={cn('text-[10px]', data.churn_risk === 'alto' ? 'border-red-500/30 text-red-700' : 'border-yellow-500/30 text-yellow-700')}>
                    {data.churn_risk}
                  </Badge>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}

function StatBlock({ icon: Icon, label, value, warn }: { icon: typeof Users; label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="text-center space-y-1">
      <Icon className={cn('h-4 w-4 mx-auto', warn ? 'text-destructive' : 'text-muted-foreground')} />
      <p className={cn('text-lg font-semibold tabular-nums', warn && 'text-destructive')}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
