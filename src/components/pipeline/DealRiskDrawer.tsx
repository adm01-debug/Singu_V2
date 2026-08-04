import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, ShieldCheck, Activity } from 'lucide-react';
import { useDealSlipRisk, type RiskLevel } from '@/hooks/useDealSlipRisk';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { cn } from '@/lib/utils';

interface Props {
  deal: PipelineDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const levelMeta: Record<RiskLevel, { label: string; cls: string; Icon: typeof Activity }> = {
  healthy: { label: 'Saudável', cls: 'text-success', Icon: ShieldCheck },
  attention: { label: 'Atenção', cls: 'text-warning', Icon: Activity },
  high: { label: 'Risco alto', cls: 'text-destructive', Icon: AlertTriangle },
};

const indicatorClass = (score: number) =>
  score >= 61 ? 'bg-destructive' : score >= 31 ? 'bg-warning' : 'bg-success';

export function DealRiskDrawer({ deal, open, onOpenChange }: Props) {
  const risk = useDealSlipRisk(deal);
  const meta = levelMeta[risk.level];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <meta.Icon className={cn('h-5 w-5', meta.cls)} />
            Análise de Slip Risk
          </SheetTitle>
          <SheetDescription>{deal?.titulo ?? '—'}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score geral</span>
              <Badge variant="outline" className={cn('font-semibold', meta.cls)}>
                {meta.label}
              </Badge>
            </div>
            <p className={cn('text-3xl font-bold mt-1', meta.cls)}>{risk.score}<span className="text-base text-muted-foreground">/100</span></p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Fatores
            </h4>
            {risk.factors.map((f) => (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground">
                    {f.score}/100 · peso {Math.round(f.weight * 100)}%
                  </span>
                </div>
                <Progress
                  value={f.score}
                  className="h-2"
                  indicatorClassName={indicatorClass(f.score)}
                />
                <p className="text-[11px] text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              Recomendações
            </h4>
            <ul className="space-y-2">
              {risk.recommendations.map((r, i) => (
                <li key={i} className="text-xs leading-relaxed p-2 rounded-md bg-muted/50 border border-border/50">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
