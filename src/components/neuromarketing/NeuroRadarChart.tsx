// ==============================================
// NEURO RADAR CHART - Visual 3-Brain System Radar
// Interactive radar visualization for brain systems
// ==============================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Info } from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem } from '@/types/neuromarketing';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface NeuroRadarChartProps {
  contactId?: string;
  contactName?: string;
  discProfile?: string | null;
  interactions?: { content: string; transcription?: string }[];
  showLegend?: boolean;
  compact?: boolean;
  title?: string;
  className?: string;
}

const NeuroRadarChart = ({ 
  contactId, 
  contactName = 'Portfólio', 
  discProfile,
  interactions = [],
  showLegend = true,
  compact = false,
  title,
  className
}: NeuroRadarChartProps) => {
  const { 
    analyzeText, 
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO
  } = useNeuromarketing();

  // Analyze interactions
  const { brainScores, dominantBrain, chartData } = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    const analysis = allText.length >= 50 ? analyzeText(allText) : null;
    const discBasedProfile = discProfile ? generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C') : null;

    const brainScores = analysis?.brainSystemScores || {
      reptilian: discBasedProfile?.brainBalance?.reptilian || 33,
      limbic: discBasedProfile?.brainBalance?.limbic || 34,
      neocortex: discBasedProfile?.brainBalance?.neocortex || 33
    };

    const dominantBrain = (Object.entries(brainScores) as [BrainSystem, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const chartData = [
      {
        brain: BRAIN_SYSTEM_INFO.reptilian.namePt.split(' ')[0],
        value: brainScores.reptilian,
        fullMark: 100,
        icon: BRAIN_SYSTEM_INFO.reptilian.icon,
        description: 'Sobrevivência e instintos'
      },
      {
        brain: BRAIN_SYSTEM_INFO.limbic.namePt.split(' ')[0],
        value: brainScores.limbic,
        fullMark: 100,
        icon: BRAIN_SYSTEM_INFO.limbic.icon,
        description: 'Emoções e conexões'
      },
      {
        brain: BRAIN_SYSTEM_INFO.neocortex.namePt.split(' ')[0],
        value: brainScores.neocortex,
        fullMark: 100,
        icon: BRAIN_SYSTEM_INFO.neocortex.icon,
        description: 'Lógica e análise'
      }
    ];

    return { brainScores, dominantBrain, chartData };
  }, [interactions, discProfile, analyzeText, generateNeuroProfileFromDISC, BRAIN_SYSTEM_INFO]);

  const firstName = contactName.split(' ')[0];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("p-4 rounded-lg border bg-card", className)}
      >
        <div className="flex items-center gap-3 mb-3">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Perfil Neural</span>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="brain" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
              />
              <Radar
                name={firstName}
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ 
                rotateY: [0, 180, 360],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            >
              <Brain className="h-5 w-5 text-primary" />
            </motion.div>
            {title || 'Radar dos 3 Cérebros'}
          </CardTitle>
          <Badge className={cn(BRAIN_SYSTEM_INFO[dominantBrain].bgColor)}>
            {BRAIN_SYSTEM_INFO[dominantBrain].icon} Dominante
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualização do perfil trino de {firstName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Radar Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 3"
              />
              <PolarAngleAxis 
                dataKey="brain" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name={firstName}
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Legend */}
        {showLegend && (
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(brainScores) as [BrainSystem, number][]).map(([system, score], index) => (
              <TooltipProvider key={system}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 rounded-lg border cursor-help transition-all",
                        system === dominantBrain 
                          ? `${BRAIN_SYSTEM_INFO[system].bgColor} ring-2 ring-primary` 
                          : 'bg-muted/30 hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{BRAIN_SYSTEM_INFO[system].icon}</span>
                        <span className="text-xs font-medium">
                          {BRAIN_SYSTEM_INFO[system].namePt.split(' ')[0]}
                        </span>
                      </div>
                      <motion.div
                        key={score}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-center"
                      >
                        {score}%
                      </motion.div>
                      {system === dominantBrain && (
                        <Badge variant="secondary" className="w-full mt-2 justify-center text-xs">
                          Principal
                        </Badge>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">{BRAIN_SYSTEM_INFO[system].namePt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {BRAIN_SYSTEM_INFO[system].descriptionPt}
                    </p>
                    <p className="text-xs mt-2">
                      <span className="font-medium">Função: </span>
                      {BRAIN_SYSTEM_INFO[system].mainFunction}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {/* Quick Insight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
        >
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-primary mb-1">Insight do Perfil</p>
              <p className="text-muted-foreground">
                {firstName} processa decisões primariamente pelo{' '}
                <span className="font-medium text-foreground">
                  {BRAIN_SYSTEM_INFO[dominantBrain].namePt}
                </span>
                : {BRAIN_SYSTEM_INFO[dominantBrain].decisionRole.toLowerCase()}.
              </p>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default NeuroRadarChart;
