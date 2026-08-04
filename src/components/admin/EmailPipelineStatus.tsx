import { Mail, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmailPipelineHealth, useRefreshPipelineHealth } from '@/hooks/useEmailPipelineHealth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: 'Saudável',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degradado',
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  offline: {
    icon: XCircle,
    label: 'Offline',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
} as const;

export function EmailPipelineStatus() {
  const { data, isLoading } = useEmailPipelineHealth();
  const refresh = useRefreshPipelineHealth();

  const status = data?.status ?? 'offline';
  const config = statusConfig[status];
  const Icon = config.icon;

  const lastEmailLabel = data?.last_email_at
    ? formatDistanceToNow(new Date(data.last_email_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Nenhum registro';

  const total24h = data?.stats_24h?.total_24h ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Pipeline de Email
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          aria-label="Atualizar status"
        >
          <RefreshCw className={cn('h-4 w-4', refresh.isPending && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded bg-muted/40" />
        ) : (
          <>
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', config.bgClass, config.colorClass)}>
              <Icon className="h-4 w-4" />
              {config.label}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Último email</p>
                <p className="font-medium">{lastEmailLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Últimas 24h</p>
                <p className="font-medium">{total24h} emails</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
