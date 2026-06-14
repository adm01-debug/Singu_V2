// ==============================================
// NEURO DECISION PATH - Visual Brain System Analysis
// Shows which brain system dominates decision-making
// ==============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Heart, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, Neurochemical, PrimalStimulus } from '@/types/neuromarketing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NeuroDecisionPathProps {
  contactId: string;
  contactName: string;
  discProfile?: string | null;
  interactions?: { content: string; transcription?: string }[];
}

const NeuroDecisionPath = ({ 
  contactId, 
  contactName, 
  discProfile,
  interactions = []
}: NeuroDecisionPathProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    analyzeText, 
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO,
    PRIMAL_STIMULUS_INFO,
    NEUROCHEMICAL_INFO
  } = useNeuromarketing();

  // Analyze all interactions
  const neuroAnalysis = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    if (allText.length < 50) {
      // Use DISC-based prediction if no text
      return null;
    }
    
    return analyzeText(allText);
  }, [interactions, analyzeText]);

  // Generate profile from DISC if no analysis
  const discBasedProfile = useMemo(() => {
    if (!discProfile) return null;
    return generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C');
  }, [discProfile, generateNeuroProfileFromDISC]);

  // Combined brain scores
  const brainScores = neuroAnalysis?.brainSystemScores || {
    reptilian: discBasedProfile?.brainBalance?.reptilian || 33,
    limbic: discBasedProfile?.brainBalance?.limbic || 34,
    neocortex: discBasedProfile?.brainBalance?.neocortex || 33
  };

  const dominantBrain = neuroAnalysis?.detectedBrainSystem || discBasedProfile?.dominantBrain || 'limbic';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Caminho de Decisão Neural
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {neuroAnalysis ? 'Baseado em Interações' : 'Baseado em DISC'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Como {contactName.split(' ')[0]} processa decisões
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="brain" className="text-xs">3 Cérebros</TabsTrigger>
            <TabsTrigger value="stimuli" className="text-xs">6 Estímulos</TabsTrigger>
            <TabsTrigger value="chemistry" className="text-xs">Química</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            {/* Dominant Brain Card */}
            <div className={`p-4 rounded-lg border-2 ${BRAIN_SYSTEM_INFO[dominantBrain].bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{BRAIN_SYSTEM_INFO[dominantBrain].icon}</span>
                <div>
                  <h3 className="font-bold text-lg">
                    {BRAIN_SYSTEM_INFO[dominantBrain].namePt}
                  </h3>
                  <p className="text-sm opacity-80">
                    {BRAIN_SYSTEM_INFO[dominantBrain].decisionRole}
                  </p>
                </div>
              </div>
              <p className="text-sm mt-2">
                {BRAIN_SYSTEM_INFO[dominantBrain].descriptionPt}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(brainScores) as [BrainSystem, number][]).map(([system, score]) => (
                <div 
                  key={system}
                  className={`p-3 rounded-lg border ${system === dominantBrain ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{BRAIN_SYSTEM_INFO[system].icon}</span>
                    <span className="text-xs font-medium">
                      {BRAIN_SYSTEM_INFO[system].namePt.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={score} className="h-2 flex-1" />
                    <span className="text-sm font-bold">{score}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Recommendations */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Estratégia de Comunicação
              </h4>
              <div className="space-y-1">
                {BRAIN_SYSTEM_INFO[dominantBrain].communicationStyle.slice(0, 3).map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* BRAIN SYSTEMS TAB */}
          <TabsContent value="brain" className="space-y-4">
            {(Object.entries(BRAIN_SYSTEM_INFO) as [BrainSystem, typeof BRAIN_SYSTEM_INFO.reptilian][]).map(([system, info]) => (
              <div 
                key={system}
                className={`p-4 rounded-lg border ${system === dominantBrain ? info.bgColor + ' border-2' : 'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h4 className="font-semibold">{info.namePt}</h4>
                      <p className="text-xs text-muted-foreground">{info.evolutionAge}</p>
                    </div>
                  </div>
                  <Badge variant={system === dominantBrain ? 'default' : 'outline'}>
                    {brainScores[system]}%
                  </Badge>
                </div>
                
                <p className="text-sm mb-3">{info.descriptionPt}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-success">Drivers:</span>
                    <ul className="mt-1 space-y-0.5">
                      {info.keyDrivers.slice(0, 3).map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-warning">Atenção:</span>
                    <ul className="mt-1 space-y-0.5">
                      {info.warnings.slice(0, 2).map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* STIMULI TAB */}
          <TabsContent value="stimuli" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Os 6 Estímulos que ativam o Cérebro Primitivo (SalesBrain NeuroMap)
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PRIMAL_STIMULUS_INFO) as [PrimalStimulus, typeof PRIMAL_STIMULUS_INFO.self_centered][]).map(([stimulus, info]) => {
                const detected = neuroAnalysis?.detectedStimuli.find(s => s.stimulus === stimulus);
                const isActive = detected && detected.score > 20;
                
                return (
                  <TooltipProvider key={stimulus}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`p-3 rounded-lg border cursor-help transition-all
                            ${isActive ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-muted/30 hover:bg-muted/50'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{info.icon}</span>
                            <span className="font-medium text-sm">{info.namePt}</span>
                          </div>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Detectado: {detected.score}%
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium mb-1">{info.namePt}</p>
                        <p className="text-xs">{info.descriptionPt}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            {/* Recommendations based on stimuli */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Estímulos Recomendados para {contactName.split(' ')[0]}
              </h5>
              <div className="space-y-1 text-sm">
                {(discBasedProfile?.responsiveStimuli || ['emotional', 'self_centered']).map((stim, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span>{PRIMAL_STIMULUS_INFO[stim as PrimalStimulus]?.icon}</span>
                    <span>{PRIMAL_STIMULUS_INFO[stim as PrimalStimulus]?.namePt}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* CHEMISTRY TAB */}
          <TabsContent value="chemistry" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-3">
              Neuroquímicos que influenciam as decisões
            </p>
            
            <div className="space-y-3">
              {(Object.entries(NEUROCHEMICAL_INFO) as [Neurochemical, typeof NEUROCHEMICAL_INFO.dopamine][]).map(([chemical, info]) => {
                const detected = neuroAnalysis?.neurochemicalProfile.find(n => n.chemical === chemical);
                const isDominant = discBasedProfile?.dominantNeurochemical === chemical;
                
                return (
                  <div 
                    key={chemical}
                    className={`p-3 rounded-lg border transition-all
                      ${isDominant ? info.bgColor + ' border-2' : detected ? 'bg-muted/50' : 'bg-muted/20'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <span className="font-medium">{info.namePt}</span>
                          {isDominant && (
                            <Badge variant="default" className="ml-2 text-xs">Dominante</Badge>
                          )}
                        </div>
                      </div>
                      {detected && (
                        <span className="text-sm font-bold">{detected.intensity}%</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">{info.effectPt}</p>
                    
                    <div className="text-xs">
                      <span className="font-medium">Aplicação em Vendas:</span>
                      <p className="mt-1 opacity-80">{info.salesApplication}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NeuroDecisionPath;
