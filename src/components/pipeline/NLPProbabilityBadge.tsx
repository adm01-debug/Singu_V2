import React from 'react';
import { Brain, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNLPClosingProbability } from '@/hooks/useNLPClosingProbability';
import type { PipelineDeal } from '@/hooks/usePipeline';

interface NLPProbabilityBadgeProps {
  deal: PipelineDeal;
}

export const NLPProbabilityBadge = ({ deal }: NLPProbabilityBadgeProps) => {
  const { data: nlpData, isLoading } = useNLPClosingProbability(deal);

  if (isLoading || !nlpData) return null;

  const levelColors = {
    low: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-success/10 text-success border-success/20',
    elite: 'bg-primary/10 text-primary border-primary/20 animate-pulse',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] gap-1 px-1.5 py-0 font-medium cursor-help",
              levelColors[nlpData.level]
            )}
          >
            <Brain className="h-3 w-3" />
            {nlpData.probability}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1">
                <Brain className="h-3 w-3 text-primary" /> Probabilidade PNL
              </span>
              <span className="text-xs font-black">{nlpData.probability}%</span>
            </div>
            
            <div className="space-y-1">
              {nlpData.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className={cn(
                    "font-medium",
                    f.impact === 'positive' ? 'text-success' : f.impact === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {f.score}%
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t mt-2 flex gap-2">
              <Info className="h-3 w-3 text-info shrink-0 mt-0.5" />
              <p className="text-[10px] italic text-muted-foreground">
                {nlpData.recommendation}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};