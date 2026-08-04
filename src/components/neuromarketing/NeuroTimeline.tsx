// ==============================================
// NEURO TIMELINE - Neural Profile Evolution History
// Shows how the brain profile changed over time
// ==============================================

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem } from '@/types/neuromarketing';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Interaction {
  id?: string;
  content: string;
  transcription?: string;
  created_at?: string;
  createdAt?: string;
}

export interface NeuroTimelineProps {
  contactId?: string;
  contactName?: string;
  discProfile?: string | null;
  interactions?: Interaction[];
  maxEntries?: number;
  className?: string;
}

interface TimelinePoint {
  date: string;
  formattedDate: string;
  dominantBrain: BrainSystem;
  brainScores: Record<BrainSystem, number>;
  interactionCount: number;
  confidence: number;
  change?: 'improved' | 'declined' | 'stable';
}

const NeuroTimeline = ({ 
  contactId, 
  contactName = 'Portfólio', 
  discProfile,
  interactions = [],
  maxEntries = 5,
  className
}: NeuroTimelineProps) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: maxEntries });
  const { analyzeText, BRAIN_SYSTEM_INFO } = useNeuromarketing();

  // Group interactions by month and analyze each period
  const timelineData = useMemo(() => {
    if (interactions.length === 0) return [];

    // Sort by date
    const sorted = [...interactions].sort((a, b) => {
      const dateA = a.created_at || a.createdAt || '';
      const dateB = b.created_at || b.createdAt || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // Group by month
    const grouped = sorted.reduce((acc, interaction) => {
      const dateStr = interaction.created_at || interaction.createdAt;
      if (!dateStr) return acc;
      const month = format(parseISO(dateStr), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(interaction);
      return acc;
    }, {} as Record<string, Interaction[]>);

    // Analyze each month
    const timeline: TimelinePoint[] = [];
    let previousDominant: BrainSystem | null = null;

    Object.entries(grouped).forEach(([month, monthInteractions]) => {
      const text = monthInteractions
        .map(i => `${i.content || ''} ${i.transcription || ''}`)
        .join('\n\n');
      
      if (text.length < 30) return;
      
      const analysis = analyzeText(text);
      
      // Determine change from previous
      let change: 'improved' | 'declined' | 'stable' | undefined;
      if (previousDominant) {
        if (analysis.detectedBrainSystem === 'neocortex' && previousDominant === 'reptilian') {
          change = 'improved';
        } else if (analysis.detectedBrainSystem === 'reptilian' && previousDominant !== 'reptilian') {
          change = 'declined';
        } else if (analysis.detectedBrainSystem !== previousDominant) {
          change = 'stable';
        }
      }

      timeline.push({
        date: month,
        formattedDate: format(parseISO(`${month}-01`), 'MMM yyyy', { locale: ptBR }),
        dominantBrain: analysis.detectedBrainSystem,
        brainScores: analysis.brainSystemScores,
        interactionCount: monthInteractions.length,
        confidence: analysis.confidence,
        change
      });

      previousDominant = analysis.detectedBrainSystem;
    });

    return timeline;
  }, [interactions, analyzeText]);

  const firstName = contactName.split(' ')[0];
  const visiblePoints = timelineData.slice(visibleRange.start, visibleRange.end);
  const canGoBack = visibleRange.start > 0;
  const canGoForward = visibleRange.end < timelineData.length;

  const navigate = (direction: 'back' | 'forward') => {
    if (direction === 'back' && canGoBack) {
      setVisibleRange(prev => ({ start: prev.start - 1, end: prev.end - 1 }));
    } else if (direction === 'forward' && canGoForward) {
      setVisibleRange(prev => ({ start: prev.start + 1, end: prev.end + 1 }));
    }
  };

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (timelineData.length < 2) return 'insufficient';
    
    const first = timelineData[0];
    const last = timelineData[timelineData.length - 1];
    
    // Moving from reptilian to other is generally positive
    if (first.dominantBrain === 'reptilian' && last.dominantBrain !== 'reptilian') {
      return 'positive';
    }
    // Moving to reptilian is generally concerning
    if (first.dominantBrain !== 'reptilian' && last.dominantBrain === 'reptilian') {
      return 'negative';
    }
    return 'stable';
  }, [timelineData]);

  if (timelineData.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Ainda não há dados suficientes para mostrar a evolução neural de {firstName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Continue registrando interações para acompanhar mudanças
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <TrendingUp className="h-5 w-5 text-primary" />
            </motion.div>
            Evolução Neural
          </CardTitle>
          <Badge 
            variant={overallTrend === 'positive' ? 'default' : 
                    overallTrend === 'negative' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {overallTrend === 'positive' && '📈 Evolução Positiva'}
            {overallTrend === 'negative' && '📉 Atenção Necessária'}
            {overallTrend === 'stable' && '➡️ Estável'}
            {overallTrend === 'insufficient' && '📊 Dados Limitados'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Como o perfil neural de {firstName} mudou ao longo do tempo
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Navigation */}
        {timelineData.length > maxEntries && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('back')}
              disabled={!canGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {visibleRange.start + 1}-{Math.min(visibleRange.end, timelineData.length)} de {timelineData.length} períodos
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('forward')}
              disabled={!canGoForward}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-border via-primary/30 to-border" />
          
          <div className="grid grid-cols-5 gap-2">
            <AnimatePresence mode="popLayout">
              {visiblePoints.map((point, index) => (
                <motion.div
                  key={point.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  {/* Brain Node */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={cn(
                      "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all",
                      BRAIN_SYSTEM_INFO[point.dominantBrain].bgColor,
                      "hover:shadow-sm"
                    )}
                  >
                    <span className="text-xl">{BRAIN_SYSTEM_INFO[point.dominantBrain].icon}</span>
                    
                    {/* Change Indicator */}
                    {point.change && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                          point.change === 'improved' ? 'bg-success text-success-foreground' :
                          point.change === 'declined' ? 'bg-destructive text-destructive-foreground' :
                          'bg-muted'
                        )}
                      >
                        {point.change === 'improved' && <TrendingUp className="h-3 w-3" />}
                        {point.change === 'declined' && <TrendingDown className="h-3 w-3" />}
                        {point.change === 'stable' && <Minus className="h-3 w-3" />}
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {/* Date */}
                  <span className="mt-2 text-xs font-medium capitalize">
                    {point.formattedDate}
                  </span>
                  
                  {/* Brain Name */}
                  <span className="text-xs text-muted-foreground text-center">
                    {BRAIN_SYSTEM_INFO[point.dominantBrain].namePt.split(' ')[0]}
                  </span>
                  
                  {/* Interaction Count */}
                  <Badge variant="outline" className="text-xs mt-1">
                    {point.interactionCount} int.
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Transition Arrows */}
        {visiblePoints.length > 1 && (
          <div className="flex justify-center gap-3 flex-wrap mt-4">
            {visiblePoints.slice(0, -1).map((point, index) => {
              const next = visiblePoints[index + 1];
              if (point.dominantBrain === next.dominantBrain) return null;
              
              return (
                <motion.div
                  key={`transition-${point.date}-${next.date}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/50"
                >
                  <span>{BRAIN_SYSTEM_INFO[point.dominantBrain].icon}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{BRAIN_SYSTEM_INFO[next.dominantBrain].icon}</span>
                  <span className="text-muted-foreground">
                    ({point.formattedDate} → {next.formattedDate})
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-primary mb-1">Análise de Evolução</p>
              <p className="text-muted-foreground">
                {timelineData.length > 1 ? (
                  <>
                    {firstName} passou de{' '}
                    <span className="font-medium text-foreground">
                      {BRAIN_SYSTEM_INFO[timelineData[0].dominantBrain].namePt}
                    </span>
                    {' '}para{' '}
                    <span className="font-medium text-foreground">
                      {BRAIN_SYSTEM_INFO[timelineData[timelineData.length - 1].dominantBrain].namePt}
                    </span>
                    {' '}ao longo de {timelineData.length} períodos.
                    {overallTrend === 'positive' && ' Isso indica maior abertura e racionalidade.'}
                    {overallTrend === 'negative' && ' Monitore sinais de estresse ou urgência.'}
                  </>
                ) : (
                  <>Primeiro registro: {BRAIN_SYSTEM_INFO[timelineData[0].dominantBrain].namePt}. Continue acompanhando.</>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default NeuroTimeline;
