import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Users, Split, Merge, UserPlus, Scale } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { TerritoryRecommendation } from '@/hooks/useTerritoryOptimization';

const TYPE_ICON: Record<TerritoryRecommendation['type'], React.ElementType> = {
  reassign: Users,
  split: Split,
  merge: Merge,
  hire: UserPlus,
  rebalance: Scale,
};

const TYPE_LABEL: Record<TerritoryRecommendation['type'], string> = {
  reassign: 'Reatribuir',
  split: 'Dividir',
  merge: 'Mesclar',
  hire: 'Contratar',
  rebalance: 'Rebalancear',
};

interface Props {
  rec: TerritoryRecommendation;
  index: number;
}

export function TerritoryRecommendationCard({ rec, index }: Props) {
  const Icon = TYPE_ICON[rec.type] ?? Sparkles;

  const priorityVariant =
    rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'warning' : 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card variant="default" className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {TYPE_LABEL[rec.type]}
            </Badge>
          </div>
          <Badge
            variant={priorityVariant === 'default' ? 'secondary' : (priorityVariant as 'destructive' | 'warning')}
            className="text-[10px] uppercase"
          >
            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
          </Badge>
        </div>

        <h3 className="font-semibold text-sm text-foreground mb-1">{rec.territory_name}</h3>
        <p className="text-sm text-foreground/90 mb-2 leading-relaxed">{rec.action}</p>

        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-3 flex-1">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5 text-success" />
          <span>{rec.impact}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-auto"
          onClick={() => toast.info('Aplicação automática em breve', {
            description: 'Por enquanto execute manualmente em Territórios ou Rodízio.',
          })}
        >
          Aplicar
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </Card>
    </motion.div>
  );
}
