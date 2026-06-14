// ==============================================
// ADVANCED TRIGGERS PANEL - Enterprise Mental Trigger Analysis
// ==============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, AlertTriangle, Clock,
  Shield, Sparkles, Activity, Gauge, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useAdvancedTriggers } from '@/hooks/useAdvancedTriggers';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { DEMO_CONTACT } from '@/domain/demoEntities';
import { ChainsTab, SaturationTab } from './advanced-triggers/AdvancedTriggersTabContent';

interface AdvancedTriggersPanelProps {
  contact?: Contact | null;
  className?: string;
}

export function AdvancedTriggersPanel({ contact: contactProp, className }: AdvancedTriggersPanelProps) {
  const contact = contactProp || DEMO_CONTACT;
  const {
    advancedTriggers, exposureAnalysis, resistanceProfile,
    resistanceScore, fullAnalysis, recommendedChains,
    intensityLevels, getSynergies, getFallbacks, getRecommendedIntensity,
  } = useAdvancedTriggers(contact);

  const [activeTab, setActiveTab] = useState<'chains' | 'saturation' | 'timing' | 'advanced'>('chains');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive bg-destructive dark:bg-destructive/30';
      case 'medium': return 'text-warning bg-warning dark:bg-warning/30';
      case 'low': return 'text-warning bg-warning dark:bg-warning/30';
      default: return 'text-success bg-success dark:bg-success/30';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-5 w-5 text-primary" />
          Gatilhos Avançados
          <Badge variant="outline" className="ml-2 text-xs">Enterprise</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Análise avançada com sequenciamento, saturação e timing neural
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resistance Score Banner */}
        {resistanceProfile && resistanceScore > 30 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-3 rounded-lg border flex items-center gap-3',
              resistanceScore > 70 ? 'bg-destructive border-destructive dark:bg-destructive/20' :
              resistanceScore > 50 ? 'bg-warning border-warning/30 dark:bg-warning/20' :
              'bg-warning border-warning dark:bg-warning/20'
            )}
          >
            <Shield className={cn(
              'h-5 w-5',
              resistanceScore > 70 ? 'text-destructive' :
              resistanceScore > 50 ? 'text-warning' : 'text-warning'
            )} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Score de Resistência</span>
                <span className="font-bold">{resistanceScore}%</span>
              </div>
              <Progress value={resistanceScore} className="h-1.5 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {resistanceProfile.recommendedApproach === 'relationship_first' && 'Foque em reconstruir relacionamento'}
                {resistanceProfile.recommendedApproach === 'evidence_heavy' && 'Use mais evidências e dados'}
                {resistanceProfile.recommendedApproach === 'reduce_pressure' && 'Reduza a pressão de vendas'}
                {resistanceProfile.recommendedApproach === 'indirect' && 'Use abordagem indireta'}
              </p>
            </div>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chains" className="text-xs gap-1"><Link2 className="h-3 w-3" />Chains</TabsTrigger>
            <TabsTrigger value="saturation" className="text-xs gap-1"><Gauge className="h-3 w-3" />Saturação</TabsTrigger>
            <TabsTrigger value="timing" className="text-xs gap-1"><Clock className="h-3 w-3" />Timing</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs gap-1"><Sparkles className="h-3 w-3" />Novos</TabsTrigger>
          </TabsList>

          <TabsContent value="chains" className="mt-4">
            <ChainsTab
              recommendedChains={recommendedChains}
              advancedTriggers={advancedTriggers}
              selectedChain={selectedChain}
              setSelectedChain={setSelectedChain}
            />
          </TabsContent>

          <TabsContent value="saturation" className="mt-4">
            <SaturationTab
              exposureAnalysis={exposureAnalysis}
              advancedTriggers={advancedTriggers}
              getSaturationColor={getSaturationColor}
            />
          </TabsContent>

          <TabsContent value="timing" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {fullAnalysis && (
                  <>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-medium">Janela Ótima de Contato</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Melhor Dia</p>
                          <p className="font-medium capitalize">{fullAnalysis.optimalContactWindow.dayOfWeek}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Melhor Horário</p>
                          <p className="font-medium">
                            {fullAnalysis.optimalContactWindow.hourRange[0]}h - {fullAnalysis.optimalContactWindow.hourRange[1]}h
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 p-2 bg-background rounded">
                        💡 {fullAnalysis.optimalContactWindow.neurochemicalReason}
                      </p>
                    </div>

                    {fullAnalysis.conflictWarnings.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Conflitos Detectados
                        </p>
                        {fullAnalysis.conflictWarnings.map((warning, i) => (
                          <div key={i} className="p-3 rounded-lg bg-warning border border-warning/30 dark:bg-warning/10 text-xs">
                            <span className="font-medium">
                              {MENTAL_TRIGGERS[warning.recentTrigger as keyof typeof MENTAL_TRIGGERS]?.name}
                            </span>
                            {' '}conflita com{' '}
                            {warning.conflictsWith.map(t => 
                              MENTAL_TRIGGERS[t as keyof typeof MENTAL_TRIGGERS]?.name
                            ).join(', ')}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {warning.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Gatilhos avançados de PNL e alta conversão
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(advancedTriggers).map(([id, trigger], index) => {
                    const recommendedIntensity = getRecommendedIntensity(id as import('@/types/triggers-advanced').AllTriggerTypes);
                    const intensityInfo = intensityLevels[recommendedIntensity - 1];

                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{trigger.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{trigger.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {trigger.nlpTechnique || trigger.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              trigger.neuralTarget === 'reptilian' && 'bg-destructive text-destructive',
                              trigger.neuralTarget === 'limbic' && 'bg-primary text-primary',
                              trigger.neuralTarget === 'neocortex' && 'bg-info text-info',
                            )}
                          >
                            {trigger.neuralTarget === 'reptilian' ? '🦎' : 
                             trigger.neuralTarget === 'limbic' ? '❤️' : '🧠'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>Nível {recommendedIntensity}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
