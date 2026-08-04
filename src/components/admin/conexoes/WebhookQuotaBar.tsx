import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useConnectionQuota } from '@/hooks/useConnectionQuota';

interface Props {
  webhookId: string;
}

export function WebhookQuotaBar({ webhookId }: Props) {
  const { data, isLoading } = useConnectionQuota(webhookId);

  if (isLoading) return <div className="h-6 bg-muted/30 rounded animate-pulse" />;
  if (!data) {
    return <p className="text-xs text-muted-foreground">Sem chamadas neste mês.</p>;
  }

  const pct = Math.min(100, Math.round((data.calls_used / Math.max(1, data.calls_limit)) * 100));
  const warn = pct >= 80;
  const blocked = data.calls_used > data.calls_limit && data.overage_blocked;
  const tone = blocked ? 'bg-destructive' : warn ? 'bg-amber-500' : 'bg-primary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Uso mensal</span>
        <div className="flex items-center gap-2">
          {blocked && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" /> Bloqueado
            </Badge>
          )}
          <span className="font-medium tabular-nums">
            {data.calls_used.toLocaleString('pt-BR')} / {data.calls_limit.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
      <Progress value={pct} indicatorClassName={tone} className="h-2" />
    </div>
  );
}
