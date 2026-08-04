import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSequenceMetrics } from '@/hooks/useSequenceEvents';
import { Mail, Eye, MousePointerClick, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props { sequenceId: string }

export function SequenceMetricsCard({ sequenceId }: Props) {
  const { data: metrics, isLoading } = useSequenceMetrics(sequenceId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!metrics) return null;

  const items = [
    { icon: Mail, label: 'Enviados', value: metrics.sent, color: 'text-primary' },
    { icon: Eye, label: 'Abertura', value: `${metrics.openRate.toFixed(1)}%`, color: 'text-success' },
    { icon: MousePointerClick, label: 'Clique', value: `${metrics.clickRate.toFixed(1)}%`, color: 'text-warning' },
    { icon: MessageCircle, label: 'Resposta', value: `${metrics.replyRate.toFixed(1)}%`, color: 'text-accent-foreground' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Métricas de Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(it => (
            <div key={it.label} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30">
              <it.icon className={`w-4 h-4 ${it.color}`} />
              <div>
                <p className="text-lg font-bold leading-tight">{it.value}</p>
                <p className="text-[10px] text-muted-foreground">{it.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
