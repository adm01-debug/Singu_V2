// ==============================================
// NEURO HEATMAP CALENDAR - Best Contact Times by Neurochemical Patterns
// ==============================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Brain,
  Zap,
  Sun,
  Moon,
  Coffee,
  Sunset
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BrainSystem, Neurochemical } from '@/types/neuromarketing';
import { NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimeSlotData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourBlock: 'morning' | 'midday' | 'afternoon' | 'evening';
  successRate: number;
  totalInteractions: number;
  dominantChemical: Neurochemical;
  avgResponseTime: number; // minutes
}

interface NeuroHeatmapCalendarProps {
  contactId?: string;
  contactName?: string;
  dominantBrain?: BrainSystem;
  timeData?: TimeSlotData[];
  className?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIME_BLOCKS = [
  { id: 'morning' as const, label: 'Manhã', hours: '8h-12h', icon: Coffee },
  { id: 'midday' as const, label: 'Almoço', hours: '12h-14h', icon: Sun },
  { id: 'afternoon' as const, label: 'Tarde', hours: '14h-18h', icon: Sunset },
  { id: 'evening' as const, label: 'Noite', hours: '18h-21h', icon: Moon }
];

// Neurochemical patterns by time of day (scientific basis)
const NEUROCHEMICAL_PATTERNS: Record<string, { chemical: Neurochemical; reason: string }> = {
  'morning': { chemical: 'cortisol', reason: 'Cortisol naturalmente alto = foco e urgência' },
  'midday': { chemical: 'serotonin', reason: 'Pico de serotonina = receptividade social' },
  'afternoon': { chemical: 'dopamine', reason: 'Busca por recompensas e novidades' },
  'evening': { chemical: 'oxytocin', reason: 'Modo relaxado = construção de confiança' }
};

// Brain system optimal times
const BRAIN_OPTIMAL_TIMES: Record<BrainSystem, { best: string[]; worst: string[]; reason: string }> = {
  reptilian: {
    best: ['morning'],
    worst: ['evening'],
    reason: 'Cérebro reptiliano responde melhor quando cortisol está alto (manhã)'
  },
  limbic: {
    best: ['midday', 'evening'],
    worst: ['morning'],
    reason: 'Cérebro límbico prefere momentos de conexão social e relaxamento'
  },
  neocortex: {
    best: ['morning', 'afternoon'],
    worst: ['evening'],
    reason: 'Cérebro racional funciona melhor com energia e foco disponíveis'
  }
};

const NeuroHeatmapCalendar = ({
  contactId,
  contactName,
  dominantBrain = 'limbic',
  timeData = [],
  className
}: NeuroHeatmapCalendarProps) => {
  
  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const data: Record<string, { score: number; chemical: Neurochemical; interactions: number }> = {};
    
    // Initialize with brain-based predictions
    const brainTimes = BRAIN_OPTIMAL_TIMES[dominantBrain];
    
    for (let day = 0; day < 7; day++) {
      TIME_BLOCKS.forEach(block => {
        const key = `${day}-${block.id}`;
        const isBest = brainTimes.best.includes(block.id);
        const isWorst = brainTimes.worst.includes(block.id);
        
        // Weekend adjustments
        const isWeekend = day === 0 || day === 6;
        const weekendPenalty = isWeekend ? -20 : 0;
        
        // Base score from brain alignment
        let baseScore = isBest ? 80 : isWorst ? 30 : 55;
        baseScore += weekendPenalty;
        
        // Override with actual data if available
        const actualData = timeData.find(t => t.dayOfWeek === day && t.hourBlock === block.id);
        if (actualData && actualData.totalInteractions >= 2) {
          baseScore = actualData.successRate;
        }
        
        data[key] = {
          score: Math.max(0, Math.min(100, baseScore)),
          chemical: actualData?.dominantChemical || NEUROCHEMICAL_PATTERNS[block.id].chemical,
          interactions: actualData?.totalInteractions || 0
        };
      });
    }
    
    return data;
  }, [dominantBrain, timeData]);

  // Find best time slots
  const bestSlots = useMemo(() => {
    return Object.entries(heatmapData)
      .map(([key, value]) => {
        const [day, block] = key.split('-');
        return { day: parseInt(day), block, ...value };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [heatmapData]);

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-success';
    if (score >= 40) return 'bg-warning';
    if (score >= 20) return 'bg-accent';
    return 'bg-destructive';
  };

  const getScoreOpacity = (score: number): number => {
    return 0.3 + (score / 100) * 0.7;
  };

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Neuro Heatmap</CardTitle>
              <p className="text-xs text-muted-foreground">
                Melhores horários para contato com {contactName}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            {dominantBrain === 'reptilian' ? 'Reptiliano' : 
             dominantBrain === 'limbic' ? 'Límbico' : 'Neocórtex'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header - Days */}
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="h-8" /> {/* Empty corner */}
              {DAYS.map((day, index) => (
                <div 
                  key={day} 
                  className={cn(
                    "h-8 flex items-center justify-center text-xs font-medium",
                    (index === 0 || index === 6) && "text-muted-foreground"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time blocks rows */}
            {TIME_BLOCKS.map(block => (
              <div key={block.id} className="grid grid-cols-8 gap-1 mb-1">
                {/* Time label */}
                <div className="flex items-center gap-1 pr-2">
                  <block.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {block.hours}
                  </span>
                </div>
                
                {/* Day cells */}
                {DAYS.map((_, dayIndex) => {
                  const key = `${dayIndex}-${block.id}`;
                  const cellData = heatmapData[key];
                  const chemicalInfo = NEUROCHEMICAL_INFO[cellData.chemical];
                  
                  return (
                    <TooltipProvider key={key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: (dayIndex + TIME_BLOCKS.indexOf(block)) * 0.02 }}
                            className={cn(
                              "h-10 rounded-md cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                              getScoreColor(cellData.score)
                            )}
                            style={{ opacity: getScoreOpacity(cellData.score) }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {DAYS_FULL[dayIndex]} - {block.label}
                            </p>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: chemicalInfo.color }}
                              />
                              <span className="text-xs">{chemicalInfo.namePt}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Score: {cellData.score.toFixed(0)}%
                            </p>
                            {cellData.interactions > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {cellData.interactions} interações anteriores
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive opacity-50" />
            <span className="text-xs text-muted-foreground">Evitar</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning opacity-70" />
            <span className="text-xs text-muted-foreground">Neutro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-xs text-muted-foreground">Ideal</span>
          </div>
        </div>

        {/* Best Time Recommendations */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Horários Recomendados
          </p>
          
          <div className="grid gap-2">
            {bestSlots.map((slot, index) => {
              const blockInfo = TIME_BLOCKS.find(b => b.id === slot.block)!;
              const chemicalInfo = NEUROCHEMICAL_INFO[slot.chemical];
              
              return (
                <motion.div
                  key={`${slot.day}-${slot.block}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {DAYS_FULL[slot.day]} - {blockInfo.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {blockInfo.hours}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: chemicalInfo.color,
                        color: chemicalInfo.color
                      }}
                    >
                      {chemicalInfo.namePt}
                    </Badge>
                    <span className="text-sm font-bold text-success">
                      {slot.score.toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Brain-based insight */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Insight Neurocientífico</p>
              <p className="text-xs text-muted-foreground mt-1">
                {BRAIN_OPTIMAL_TIMES[dominantBrain].reason}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroHeatmapCalendar;
