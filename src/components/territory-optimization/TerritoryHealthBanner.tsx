import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  healthScore: number;
  totalTerritories: number;
  underservedCount: number;
  analyzedAt: string;
}

export function TerritoryHealthBanner({
  healthScore,
  totalTerritories,
  underservedCount,
  analyzedAt,
}: Props) {
  const variant: 'success' | 'warning' | 'destructive' =
    healthScore >= 75 ? 'success' : healthScore >= 50 ? 'warning' : 'destructive';

  const Icon = healthScore >= 75 ? CheckCircle2 : healthScore >= 50 ? Activity : AlertTriangle;

  const insight =
    healthScore >= 75
      ? 'Sua malha de territórios está balanceada e bem coberta. Continue monitorando.'
      : healthScore >= 50
        ? 'Há oportunidades de rebalanceamento. Veja as recomendações abaixo.'
        : 'Cobertura ou balanceamento crítico. Aja sobre as recomendações de alta prioridade.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant={variant} className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
              variant === 'success' && 'bg-success/15 text-success',
              variant === 'warning' && 'bg-warning/15 text-warning',
              variant === 'destructive' && 'bg-destructive/15 text-destructive',
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">
                Saúde da Malha de Territórios
              </h2>
              <span className="text-3xl font-bold text-foreground">{healthScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{insight}</p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              {totalTerritories} territórios analisados • {underservedCount} requerem atenção •{' '}
              Última análise: {new Date(analyzedAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
