// ==============================================
// NEURO-ENRICHED TRIGGERS - Triggers with Brain Science
// Shows triggers mapped to brain systems and neurochemicals
// ==============================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain,
  Heart,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { BrainSystem } from '@/types/neuromarketing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NeuroEnrichedTriggersProps {
  discProfile?: string | null;
  showAll?: boolean;
}

const NeuroEnrichedTriggers = ({ discProfile, showAll = false }: NeuroEnrichedTriggersProps) => {
  const { 
    getTriggerNeuroMapping,
    BRAIN_SYSTEM_INFO,
    NEUROCHEMICAL_INFO,
    PRIMAL_STIMULUS_INFO
  } = useNeuromarketing();

  // Get all triggers with neuro mapping
  const enrichedTriggers = useMemo(() => {
    return Object.entries(MENTAL_TRIGGERS).map(([id, trigger]) => {
      const neuroMapping = getTriggerNeuroMapping(id);
      
      // Calculate effectiveness multiplier based on DISC profile
      let effectivenessMultiplier = 1;
      if (discProfile && trigger.bestFor.includes(discProfile)) {
        effectivenessMultiplier = 1.3;
      } else if (discProfile && trigger.avoidFor.includes(discProfile)) {
        effectivenessMultiplier = 0.6;
      }
      
      return {
        ...trigger,
        id,
        neuroMapping,
        effectivenessMultiplier,
        adjustedEffectiveness: Math.round(trigger.effectiveness * effectivenessMultiplier)
      };
    }).sort((a, b) => b.adjustedEffectiveness - a.adjustedEffectiveness);
  }, [getTriggerNeuroMapping, discProfile]);

  const getBrainIcon = (system: BrainSystem) => {
    switch (system) {
      case 'reptilian': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'limbic': return <Heart className="h-4 w-4 text-primary" />;
      case 'neocortex': return <Brain className="h-4 w-4 text-info" />;
    }
  };

  const displayTriggers = showAll ? enrichedTriggers : enrichedTriggers.slice(0, 8);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gatilhos Neuro-Enriquecidos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gatilhos mentais mapeados para sistemas cerebrais e neuroquímicos
        </p>
      </CardHeader>

      <CardContent>
        <ScrollArea className={showAll ? 'h-[500px]' : 'h-auto'}>
          <div className="space-y-3">
            {displayTriggers.map((trigger) => (
              <div 
                key={trigger.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-md
                  ${trigger.effectivenessMultiplier > 1 ? 'bg-success dark:bg-success/20 border-success' :
                    trigger.effectivenessMultiplier < 1 ? 'bg-destructive dark:bg-destructive/20 border-destructive' :
                    'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{trigger.icon}</span>
                    <div>
                      <h4 className="font-medium text-sm">{trigger.name}</h4>
                      <p className="text-xs text-muted-foreground">{trigger.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Effectiveness Badge */}
                    <Badge 
                      variant={trigger.adjustedEffectiveness >= 8 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {trigger.adjustedEffectiveness}/10
                    </Badge>
                    
                    {/* Multiplier indicator */}
                    {trigger.effectivenessMultiplier !== 1 && (
                      <Badge 
                        variant={trigger.effectivenessMultiplier > 1 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {trigger.effectivenessMultiplier > 1 ? '↑' : '↓'} 
                        {Math.round((trigger.effectivenessMultiplier - 1) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Neuro Mapping */}
                {trigger.neuroMapping && (
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                    {/* Brain System */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            {getBrainIcon(trigger.neuroMapping.brainSystem)}
                            <span className="text-xs font-medium">
                              {BRAIN_SYSTEM_INFO[trigger.neuroMapping.brainSystem].namePt.split(' ')[0]}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{BRAIN_SYSTEM_INFO[trigger.neuroMapping.brainSystem].namePt}</p>
                          <p className="text-xs max-w-xs">{BRAIN_SYSTEM_INFO[trigger.neuroMapping.brainSystem].decisionRole}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Stimulus */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <span>{PRIMAL_STIMULUS_INFO[trigger.neuroMapping.primaryStimulus].icon}</span>
                            <span className="text-xs">
                              {PRIMAL_STIMULUS_INFO[trigger.neuroMapping.primaryStimulus].namePt}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{PRIMAL_STIMULUS_INFO[trigger.neuroMapping.primaryStimulus].namePt}</p>
                          <p className="text-xs max-w-xs">{PRIMAL_STIMULUS_INFO[trigger.neuroMapping.primaryStimulus].descriptionPt}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Neurochemical */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <span>{NEUROCHEMICAL_INFO[trigger.neuroMapping.neurochemical].icon}</span>
                            <span className="text-xs">
                              {NEUROCHEMICAL_INFO[trigger.neuroMapping.neurochemical].namePt}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{NEUROCHEMICAL_INFO[trigger.neuroMapping.neurochemical].namePt}</p>
                          <p className="text-xs max-w-xs">{NEUROCHEMICAL_INFO[trigger.neuroMapping.neurochemical].salesApplication}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Best/Avoid For */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  {trigger.bestFor.length > 0 && (
                    <span className="text-success dark:text-success">
                      ✓ Ideal: {trigger.bestFor.join(', ')}
                    </span>
                  )}
                  {trigger.avoidFor.length > 0 && (
                    <span className="text-destructive dark:text-destructive">
                      ✗ Evitar: {trigger.avoidFor.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NeuroEnrichedTriggers;
