import { memo } from 'react';
import { Sparkles, RotateCcw, Calendar, Clock, Smile, Radio, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProntidaoWeightsStore } from '@/stores/useProntidaoWeightsStore';
import type { ProntidaoWeights } from '@/domain/leadScoring';
import { evaluateWeightsHealth } from '@/lib/prontidaoWeightsHealth';

const FACTORS: Array<{
  key: keyof ProntidaoWeights;
  label: string;
  icon: typeof Calendar;
  hint: string;
}> = [
  { key: 'cadence', label: 'Cadência', icon: Calendar, hint: 'Frequência de contato ao longo do tempo' },
  { key: 'recency', label: 'Recência', icon: Clock, hint: 'Quão recente foi a última interação' },
  { key: 'sentiment', label: 'Sentimento', icon: Smile, hint: 'Tom emocional das conversas' },
  { key: 'channel', label: 'Canal preferido', icon: Radio, hint: 'Uso do canal de maior afinidade' },
];

export const ProntidaoDefaultsSection = memo(() => {
  const defaultWeights = useProntidaoWeightsStore((s) => s.defaultWeights);
  const setDefaultWeight = useProntidaoWeightsStore((s) => s.setDefaultWeight);
  const resetDefaults = useProntidaoWeightsStore((s) => s.resetDefaults);

  const health = evaluateWeightsHealth(defaultWeights);
  const total = health.total;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Score de Prontidão
        </CardTitle>
        <CardDescription>
          Estes pesos definem o cálculo do Score de Prontidão para todas as fichas. Você pode
          sobrescrever pontualmente em uma ficha específica usando o ícone de ajuste no card
          de score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {health.status === 'zero' && (
          <Alert
            role="status"
            className="border-destructive/50 text-destructive [&>svg]:text-destructive py-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Soma dos pesos é zero. Sem proporção definida, o score volta ao padrão de fábrica.
              Aumente pelo menos um fator.
            </AlertDescription>
          </Alert>
        )}
        {health.status === 'low' && (
          <Alert role="status" className="border-warning/50 text-foreground py-2">
            <Info className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs">
              Pesos muito baixos (soma {total}%). O sistema vai normalizar automaticamente, mas
              a precisão fica reduzida. Considere aumentar a proporção entre os fatores.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          {FACTORS.map(({ key, label, icon: Icon, hint }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground truncate">{hint}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground w-12 text-right">
                  {defaultWeights[key]}%
                </span>
              </div>
              <Slider
                min={0}
                max={60}
                step={5}
                value={[defaultWeights[key]]}
                onValueChange={(v) => setDefaultWeight(key, v[0] ?? 0)}
                aria-label={`Peso padrão de ${label}`}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-xs tabular-nums cursor-help"
                    aria-label={
                      health.status === 'ok'
                        ? `Total ${total}%. Normalizados: Cadência ${health.normalized.cadence}%, Recência ${health.normalized.recency}%, Sentimento ${health.normalized.sentiment}%, Canal ${health.normalized.channel}%.`
                        : `Total ${total}%`
                    }
                  >
                    Total: {total}%
                  </Badge>
                </TooltipTrigger>
                {health.status === 'ok' && (
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium mb-1">Após normalização</div>
                    <div className="space-y-0.5 tabular-nums">
                      <div>Cadência: {health.normalized.cadence}%</div>
                      <div>Recência: {health.normalized.recency}%</div>
                      <div>Sentimento: {health.normalized.sentiment}%</div>
                      <div>Canal: {health.normalized.channel}%</div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={resetDefaults}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar padrões
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              O que importa é a <strong>proporção</strong> entre os fatores, não a soma. Os pesos
              são normalizados automaticamente.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
ProntidaoDefaultsSection.displayName = 'ProntidaoDefaultsSection';
