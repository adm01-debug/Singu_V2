import { motion, AnimatePresence } from 'framer-motion';
import { History, TrendingUp, TrendingDown, Minus, Star, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { ProfileMetrics, DISC_CONFIG } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export function ProfileCard({ metrics, isExpanded, onToggle }: {
  metrics: ProfileMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = DISC_CONFIG[metrics.profile];

  return (
    <motion.div layout className={cn('border rounded-xl overflow-hidden transition-shadow', isExpanded && 'shadow-md')}>
      <div className={cn('p-4 cursor-pointer hover:bg-muted/30 transition-colors', config.bgColor)} onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold bg-background border-2', config.color)}>
              {metrics.profile}
            </div>
            <div>
              <h4 className={cn('font-semibold', config.color)}>{config.label}</h4>
              <p className="text-xs text-muted-foreground">{metrics.totalUsages} templates usados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className={cn('text-lg font-bold', metrics.successRate >= 70 ? 'text-success' : metrics.successRate >= 40 ? 'text-warning' : 'text-destructive')}>
                  {metrics.successRate.toFixed(0)}%
                </span>
                <TrendIcon trend={metrics.trend} />
              </div>
              <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Subir" className="h-8 w-8">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4 bg-background border-t space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-success">{metrics.successCount}</p>
                  <p className="text-xs text-muted-foreground">Sucessos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <p className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{metrics.totalUsages}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {metrics.topTemplates.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Templates Mais Efetivos
                  </h5>
                  <div className="space-y-2">
                    {metrics.topTemplates.slice(0, 3).map((template, idx) => {
                      const trigger = MENTAL_TRIGGERS[template.triggerType as keyof typeof MENTAL_TRIGGERS];
                      return (
                        <div key={template.templateId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                            <span>{trigger?.icon}</span>
                            <span className="text-sm font-medium truncate max-w-[180px]">{template.templateTitle}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{template.usages}x</Badge>
                            <span className={cn('text-sm font-semibold', template.successRate >= 70 ? 'text-success' : 'text-warning')}>
                              {template.successRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {metrics.recentUsages.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Uso Recente
                  </h5>
                  <div className="space-y-1.5">
                    {metrics.recentUsages.slice(0, 3).map((usage) => {
                      const trigger = MENTAL_TRIGGERS[usage.trigger_type as keyof typeof MENTAL_TRIGGERS];
                      return (
                        <div key={usage.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{trigger?.icon}</span>
                            <span className="text-muted-foreground truncate max-w-[150px]">{usage.template_title || trigger?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-xs',
                              usage.result === 'success' && 'border-success text-success',
                              usage.result === 'failure' && 'border-destructive text-destructive'
                            )}>
                              {usage.result === 'success' ? 'Sucesso' : usage.result === 'failure' ? 'Falhou' : usage.result === 'neutral' ? 'Neutro' : 'Pendente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{format(new Date(usage.used_at), 'd MMM', { locale: ptBR })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
