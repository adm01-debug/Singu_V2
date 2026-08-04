import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lightbulb, TrendingUp, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WinLossInsight } from '@/hooks/useWinLoss';
import { useDeleteInsight } from '@/hooks/useWinLoss';

interface Props {
  insight: WinLossInsight;
}

const config = {
  pattern: { icon: TrendingUp, label: 'Padrão' },
  recommendation: { icon: Lightbulb, label: 'Recomendação' },
  alert: { icon: AlertTriangle, label: 'Alerta' },
};

const sevColors = {
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  critical: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const sevIcon = {
  info: Lightbulb,
  warning: AlertTriangle,
  critical: AlertTriangle,
  success: CheckCircle2,
};

export function WinLossInsightCard({ insight }: Props) {
  const Icon = config[insight.insight_type].icon;
  const SevIcon = sevIcon[insight.severity];
  const del = useDeleteInsight();

  return (
    <Card className={cn('border-l-4', sevColors[insight.severity].split(' ').find(c => c.startsWith('border-')))}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={cn('text-xs', sevColors[insight.severity])}>
              <SevIcon className="h-3 w-3 mr-1" />
              {config[insight.insight_type].label}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => del.mutate(insight.id)}
            aria-label="Descartar insight"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-2">
          {new Date(insight.generated_at).toLocaleString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
}
