// ==============================================
// NEURO COMPATIBILITY ANALYSIS
// Analyzes neural compatibility between salesperson and contact
// ==============================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Users,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import type { NeuroDecisionProfile, Neurochemical } from '@/types/neuromarketing';

type DISCProfile = 'D' | 'I' | 'S' | 'C';

interface NeuroCompatibilityAnalysisProps {
  salespersonDISC: DISCProfile;
  contactDISC?: DISCProfile | null;
  contactName: string;
}

const NeuroCompatibilityAnalysis = ({
  salespersonDISC,
  contactDISC,
  contactName
}: NeuroCompatibilityAnalysisProps) => {
  const { 
    generateNeuroProfileFromDISC,
    calculateNeuroCompatibility,
    BRAIN_SYSTEM_INFO
  } = useNeuromarketing();

  // Generate profiles
  const salespersonProfile = useMemo(() => 
    generateNeuroProfileFromDISC(salespersonDISC),
  [salespersonDISC, generateNeuroProfileFromDISC]);

  const contactProfile = useMemo(() => 
    generateNeuroProfileFromDISC(contactDISC || 'S'),
  [contactDISC, generateNeuroProfileFromDISC]);

  // Calculate compatibility
  const compatibility = useMemo(() => {
    if (!contactProfile.dominantBrain) return null;
    
    return calculateNeuroCompatibility(salespersonDISC, {
      contactId: '',
      dominantBrain: contactProfile.dominantBrain,
      brainBalance: contactProfile.brainBalance as NeuroDecisionProfile['brainBalance'],
      responsiveStimuli: (contactProfile.responsiveStimuli || []) as NeuroDecisionProfile['responsiveStimuli'],
      dominantNeurochemical: (contactProfile.dominantNeurochemical || 'oxytocin') as Neurochemical,
      neurochemicalBalance: { dopamine: 50, serotonin: 50, oxytocin: 50, cortisol: 50, adrenaline: 50, endorphin: 50 } as Record<Neurochemical, number>,
      decisionSpeed: contactProfile.decisionSpeed || 'moderate',
      riskTolerance: contactProfile.riskTolerance || 'medium',
      primaryMotivation: contactProfile.primaryMotivation || 'balanced',
      trustLevel: 'neutral',
      optimalApproach: [],
      avoidApproach: [],
      lastAnalyzed: new Date().toISOString(),
      confidence: 70
    });
  }, [salespersonDISC, contactProfile, calculateNeuroCompatibility]);

  if (!compatibility) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success border-success';
    if (score >= 60) return 'bg-warning border-warning';
    return 'bg-destructive border-destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Compatibilidade Neural
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Você ({salespersonDISC}) ↔ {contactName} ({contactDISC || '?'})
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className={`p-4 rounded-lg border-2 ${getScoreBg(compatibility.score)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Compatibilidade Geral</span>
            <span className={`text-2xl font-bold ${getScoreColor(compatibility.score)}`}>
              {compatibility.score}%
            </span>
          </div>
          <Progress value={compatibility.score} className="h-3" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-info" />
              <span className="text-sm font-medium">Alinhamento Cerebral</span>
            </div>
            <Progress value={compatibility.brainAlignment} className="h-2 mb-1" />
            <span className="text-xs text-muted-foreground">{compatibility.brainAlignment}%</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Match de Estímulos</span>
            </div>
            <Progress value={compatibility.stimuliMatch} className="h-2 mb-1" />
            <span className="text-xs text-muted-foreground">{compatibility.stimuliMatch}%</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧪</span>
              <span className="text-sm font-medium">Química Neural</span>
            </div>
            <Progress value={compatibility.chemicalBalance} className="h-2 mb-1" />
            <span className="text-xs text-muted-foreground">{compatibility.chemicalBalance}%</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">Fit Comunicação</span>
            </div>
            <Progress value={compatibility.communicationFit} className="h-2 mb-1" />
            <span className="text-xs text-muted-foreground">{compatibility.communicationFit}%</span>
          </div>
        </div>

        {/* Brain Comparison */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <h4 className="font-medium text-sm mb-3">Comparação de Sistemas Cerebrais</h4>
          <div className="flex items-center justify-center gap-4">
            {/* Salesperson */}
            <div className="text-center">
              <span className="text-2xl">
                {BRAIN_SYSTEM_INFO[salespersonProfile.dominantBrain || 'limbic'].icon}
              </span>
              <p className="text-xs font-medium mt-1">Você</p>
              <p className="text-xs text-muted-foreground">
                {BRAIN_SYSTEM_INFO[salespersonProfile.dominantBrain || 'limbic'].namePt.split(' ')[0]}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            {/* Contact */}
            <div className="text-center">
              <span className="text-2xl">
                {BRAIN_SYSTEM_INFO[contactProfile.dominantBrain || 'limbic'].icon}
              </span>
              <p className="text-xs font-medium mt-1">{contactName.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">
                {BRAIN_SYSTEM_INFO[contactProfile.dominantBrain || 'limbic'].namePt.split(' ')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {compatibility.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Pontos Fortes
            </h4>
            <div className="space-y-1">
              {compatibility.strengths.map((strength, i) => (
                <div key={i} className="text-sm flex items-center gap-2 text-success dark:text-success">
                  <span>•</span> {strength}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        {compatibility.challenges.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Desafios
            </h4>
            <div className="space-y-1">
              {compatibility.challenges.map((challenge, i) => (
                <div key={i} className="text-sm flex items-center gap-2 text-warning dark:text-warning">
                  <span>•</span> {challenge}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adaptation Tips */}
        {compatibility.adaptationTips.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Dicas de Adaptação
            </h4>
            <div className="space-y-1">
              {compatibility.adaptationTips.map((tip, i) => (
                <div key={i} className="text-sm flex items-center gap-2">
                  <span className="text-primary">→</span> {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroCompatibilityAnalysis;
