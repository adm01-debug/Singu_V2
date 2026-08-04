import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain, Link2, Clock, ChevronRight, Target, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS } from '@/types/triggers';

interface ChainsTabProps {
  recommendedChains: Array<{
    id: string;
    name: string;
    description: string;
    successRate: number;
    triggers: string[];
    neuralPath: { brainSequence: string[] };
    timing: Array<{ trigger: string; delayMinutes: number }>;
  }>;
  advancedTriggers: Record<string, { icon: string; name: string; description: string }>;
  selectedChain: string | null;
  setSelectedChain: (id: string | null) => void;
}

export function ChainsTab({ recommendedChains, advancedTriggers, selectedChain, setSelectedChain }: ChainsTabProps) {
  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground mb-3">
          Sequências validadas de gatilhos com taxas de sucesso comprovadas
        </p>
        
        {recommendedChains.map((chain, index) => (
          <motion.div
            key={chain.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer',
              selectedChain === chain.id 
                ? 'bg-primary/5 border-primary/30 shadow-md' 
                : 'bg-muted/30 hover:bg-muted/50'
            )}
            onClick={() => setSelectedChain(selectedChain === chain.id ? null : chain.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{chain.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={chain.successRate >= 70 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {chain.successRate}% sucesso
                </Badge>
                <ChevronRight className={cn(
                  'h-4 w-4 transition-transform',
                  selectedChain === chain.id && 'rotate-90'
                )} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{chain.description}</p>

            <div className="flex items-center gap-1 flex-wrap">
              {chain.triggers.map((triggerId, i) => {
                const trigger = MENTAL_TRIGGERS[triggerId as keyof typeof MENTAL_TRIGGERS] ||
                                advancedTriggers[triggerId as keyof typeof advancedTriggers];
                return (
                  <div key={triggerId} className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs gap-1">
                            <span>{trigger?.icon}</span>
                            {trigger?.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{trigger?.name}</p>
                          <p className="text-xs max-w-xs">{trigger?.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {i < chain.triggers.length - 1 && (
                      <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {selectedChain === chain.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t space-y-3"
                >
                  <div>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Caminho Neural
                    </p>
                    <div className="flex items-center gap-2">
                      {chain.neuralPath.brainSequence.map((brain, i) => (
                        <div key={i} className="flex items-center">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              'text-xs',
                              brain === 'reptilian' && 'bg-destructive text-destructive dark:bg-destructive/30',
                              brain === 'limbic' && 'bg-primary text-primary dark:bg-primary/30',
                              brain === 'neocortex' && 'bg-info text-info dark:bg-info/30'
                            )}
                          >
                            {brain === 'reptilian' ? '🦎 Reptiliano' : 
                             brain === 'limbic' ? '❤️ Límbico' : '🧠 Neocórtex'}
                          </Badge>
                          {i < chain.neuralPath.brainSequence.length - 1 && (
                            <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Timing Recomendado
                    </p>
                    <div className="space-y-1">
                      {chain.timing.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span>{(MENTAL_TRIGGERS[t.trigger as keyof typeof MENTAL_TRIGGERS] || 
                                 advancedTriggers[t.trigger as keyof typeof advancedTriggers])?.name}</span>
                          <span className="text-muted-foreground">
                            {t.delayMinutes === 0 ? 'Imediato' :
                             t.delayMinutes < 60 ? `+${t.delayMinutes}min` :
                             t.delayMinutes < 1440 ? `+${Math.round(t.delayMinutes/60)}h` :
                             `+${Math.round(t.delayMinutes/1440)}d`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {recommendedChains.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma chain recomendada</p>
            <p className="text-xs">Adicione perfil DISC para sugestões personalizadas</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

interface SaturationTabProps {
  exposureAnalysis: Array<{
    triggerId: string;
    saturationLevel: string;
    saturated: boolean;
    exposureCount: number;
    averageEffectiveness: number;
    cooldownUntil?: string | null;
  }>;
  advancedTriggers: Record<string, { icon: string; name: string }>;
  getSaturationColor: (level: string) => string;
}

export function SaturationTab({ exposureAnalysis, advancedTriggers, getSaturationColor }: SaturationTabProps) {
  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground mb-3">
          Monitore a exposição do cliente a cada gatilho para evitar saturação
        </p>

        {exposureAnalysis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gauge className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sem dados de exposição</p>
            <p className="text-xs">Use gatilhos para começar a rastrear</p>
          </div>
        ) : (
          exposureAnalysis.map((exposure, index) => {
            const trigger = MENTAL_TRIGGERS[exposure.triggerId as keyof typeof MENTAL_TRIGGERS] ||
                           advancedTriggers[exposure.triggerId as keyof typeof advancedTriggers];
            const saturationPercent = exposure.saturationLevel === 'high' ? 100 :
                                      exposure.saturationLevel === 'medium' ? 70 :
                                      exposure.saturationLevel === 'low' ? 40 : 20;
            
            return (
              <motion.div
                key={exposure.triggerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'p-3 rounded-lg border',
                  exposure.saturated ? 'bg-destructive border-destructive dark:bg-destructive/10' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{trigger?.icon}</span>
                    <span className="font-medium text-sm">{trigger?.name}</span>
                  </div>
                  <Badge className={getSaturationColor(exposure.saturationLevel)}>
                    {exposure.saturationLevel === 'high' ? 'Saturado' :
                     exposure.saturationLevel === 'medium' ? 'Alto' :
                     exposure.saturationLevel === 'low' ? 'Moderado' : 'Livre'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <div>
                    <span className="font-medium">{exposure.exposureCount}</span> usos
                  </div>
                  <div>
                    <span className="font-medium">{exposure.averageEffectiveness.toFixed(1)}</span>/10 efic.
                  </div>
                  <div className="text-right">
                    {exposure.cooldownUntil ? (
                      <span className="text-warning">⏳ Cooldown</span>
                    ) : (
                      <span className="text-success">✓ Disponível</span>
                    )}
                  </div>
                </div>

                <Progress 
                  value={saturationPercent} 
                  className={cn(
                    'h-1.5',
                    exposure.saturated && '[&>div]:bg-destructive'
                  )}
                />
              </motion.div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
