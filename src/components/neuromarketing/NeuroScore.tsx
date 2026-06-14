// ==============================================
// NEURO SCORE - Unified Neuroscience Score Component
// Combines brain system, stimuli, and neurochemistry
// ==============================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, Minus, Sparkles, Info } from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NeuroScoreProps {
  contactId: string;
  contactName: string;
  discProfile?: string | null;
  interactions?: { content: string; transcription?: string; created_at?: string }[];
  previousScore?: number;
  compact?: boolean;
  className?: string;
}

interface ScoreBreakdown {
  brainAlignment: number;
  stimuliActivation: number;
  chemicalBalance: number;
  dataQuality: number;
}

const NeuroScore = ({ 
  contactId, 
  contactName, 
  discProfile,
  interactions = [],
  previousScore,
  compact = false,
  className
}: NeuroScoreProps) => {
  const {
    analyzeText,
    generateNeuroProfileFromDISC
  } = useNeuromarketing();

  // Calculate comprehensive neuro score
  const { score, breakdown, trend } = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    const analysis = allText.length >= 50 ? analyzeText(allText) : null;
    const discBasedProfile = discProfile ? generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C') : null;

    // Score components
    const breakdown: ScoreBreakdown = {
      brainAlignment: 0,
      stimuliActivation: 0,
      chemicalBalance: 0,
      dataQuality: 0
    };

    // 1. Brain Alignment Score (0-25 points)
    // Higher score if there's a clear dominant brain system
    if (analysis) {
      const scores = Object.values(analysis.brainSystemScores);
      const maxScore = Math.max(...scores);
      const variance = maxScore - Math.min(...scores);
      breakdown.brainAlignment = Math.round((variance / 100) * 20 + 5);
    } else if (discBasedProfile) {
      breakdown.brainAlignment = 15; // Baseline from DISC
    }

    // 2. Stimuli Activation Score (0-25 points)
    // More detected stimuli = higher score
    if (analysis && analysis.detectedStimuli.length > 0) {
      const activeStimuli = analysis.detectedStimuli.filter(s => s.score > 20);
      breakdown.stimuliActivation = Math.min(25, activeStimuli.length * 6 + 5);
    } else if (discBasedProfile) {
      breakdown.stimuliActivation = 12; // Baseline
    }

    // 3. Chemical Balance Score (0-25 points)
    // Presence of positive chemicals vs stress chemicals
    if (analysis && analysis.neurochemicalProfile.length > 0) {
      const positiveChemicals = ['dopamine', 'oxytocin', 'serotonin', 'endorphin'];
      const positiveCount = analysis.neurochemicalProfile.filter(
        n => positiveChemicals.includes(n.chemical) && n.intensity > 30
      ).length;
      breakdown.chemicalBalance = Math.min(25, positiveCount * 8 + 5);
    } else if (discBasedProfile) {
      breakdown.chemicalBalance = 15; // Baseline
    }

    // 4. Data Quality Score (0-25 points)
    // Based on amount and recency of interaction data
    const interactionCount = interactions.length;
    const hasRecentInteraction = interactions.some(i => {
      if (!i.created_at) return false;
      const daysAgo = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 30;
    });
    
    breakdown.dataQuality = Math.min(25, 
      (interactionCount * 3) + 
      (hasRecentInteraction ? 10 : 0) +
      (allText.length > 500 ? 5 : 0)
    );

    const totalScore = breakdown.brainAlignment + breakdown.stimuliActivation + 
                       breakdown.chemicalBalance + breakdown.dataQuality;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (previousScore !== undefined) {
      if (totalScore > previousScore + 5) trend = 'up';
      else if (totalScore < previousScore - 5) trend = 'down';
    }

    return { 
      score: Math.min(100, totalScore), 
      breakdown, 
      analysis,
      trend
    };
  }, [interactions, discProfile, analyzeText, generateNeuroProfileFromDISC, previousScore]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-success/10 border-success/30';
    if (score >= 50) return 'bg-warning/10 border-warning/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excelente';
    if (score >= 70) return 'Muito Bom';
    if (score >= 55) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Precisa Dados';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border cursor-help transition-all hover:shadow-md",
                getScoreBg(score),
                className
              )}
            >
              <div className="relative">
                <Brain className={cn("h-6 w-6", getScoreColor(score))} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                </motion.div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <motion.span 
                    key={score}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn("text-xl font-bold", getScoreColor(score))}
                  >
                    {score}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                  {trend !== 'stable' && (
                    <TrendIcon className={cn(
                      "h-4 w-4",
                      trend === 'up' ? 'text-success' : 'text-destructive'
                    )} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Neuro Score</p>
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64 p-3">
            <p className="font-medium mb-2">Composição do Score:</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>🧠 Alinhamento Cerebral</span>
                <span>{breakdown.brainAlignment}/25</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ Ativação de Estímulos</span>
                <span>{breakdown.stimuliActivation}/25</span>
              </div>
              <div className="flex justify-between">
                <span>🧪 Equilíbrio Químico</span>
                <span>{breakdown.chemicalBalance}/25</span>
              </div>
              <div className="flex justify-between">
                <span>📊 Qualidade dos Dados</span>
                <span>{breakdown.dataQuality}/25</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Brain className="h-5 w-5 text-primary" />
            </motion.div>
            Neuro Score
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {getScoreLabel(score)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className={cn(
          "relative p-6 rounded-xl border-2 text-center overflow-hidden",
          getScoreBg(score)
        )}>
          {/* Animated Background Glow */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 30% 30%, hsl(var(--primary)) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 70%, hsl(var(--primary)) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 70%, hsl(var(--primary)) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 30%, hsl(var(--primary)) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="relative">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center gap-3"
            >
              <motion.span 
                key={score}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn("text-5xl font-bold", getScoreColor(score))}
              >
                {score}
              </motion.span>
              <div className="flex flex-col items-start">
                <span className="text-lg text-muted-foreground">/ 100</span>
                {trend !== 'stable' && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    trend === 'up' ? 'text-success' : 'text-destructive'
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{trend === 'up' ? 'Subindo' : 'Caindo'}</span>
                  </div>
                )}
              </div>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-2">
              Perfil Neurocientífico de {contactName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Composição do Score
          </h4>
          
          {[
            { key: 'brainAlignment', icon: '🧠', label: 'Alinhamento Cerebral', desc: 'Clareza do cérebro dominante' },
            { key: 'stimuliActivation', icon: '⚡', label: 'Ativação de Estímulos', desc: 'Estímulos primais detectados' },
            { key: 'chemicalBalance', icon: '🧪', label: 'Equilíbrio Químico', desc: 'Neuroquímicos positivos vs negativos' },
            { key: 'dataQuality', icon: '📊', label: 'Qualidade dos Dados', desc: 'Volume e recência das interações' },
          ].map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-muted-foreground">
                  {breakdown[item.key as keyof ScoreBreakdown]}/25
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={(breakdown[item.key as keyof ScoreBreakdown] / 25) * 100} 
                  className="h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {score < 70 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <p className="text-sm font-medium mb-2">💡 Como melhorar o score:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              {breakdown.dataQuality < 15 && (
                <li>• Registre mais interações com {contactName.split(' ')[0]}</li>
              )}
              {breakdown.brainAlignment < 15 && (
                <li>• Analise textos mais longos para identificar padrões</li>
              )}
              {breakdown.stimuliActivation < 15 && (
                <li>• Observe quais estímulos geram mais resposta</li>
              )}
              {breakdown.chemicalBalance < 15 && (
                <li>• Monitore estados emocionais durante interações</li>
              )}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroScore;
