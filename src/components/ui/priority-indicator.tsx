import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';

interface PriorityIndicatorProps {
  relationshipScore: number;
  lastInteractionDate?: string | null;
  className?: string;
  showTooltip?: boolean;
}

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'healthy';

interface PriorityConfig {
  level: PriorityLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof AlertTriangle;
  pulse: boolean;
}

function calculatePriority(score: number, daysSinceContact: number | null): PriorityConfig {
  // Critical: Low score AND long time without contact
  if (score < 40 && daysSinceContact !== null && daysSinceContact > 30) {
    return {
      level: 'critical',
      label: 'Crítico',
      description: `Score baixo (${score}) e sem contato há ${daysSinceContact} dias`,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive',
      icon: Flame,
      pulse: true,
    };
  }

  // High: Either very low score OR very long time without contact
  if (score < 40 || (daysSinceContact !== null && daysSinceContact > 30)) {
    const reason = score < 40 
      ? `Score baixo (${score})` 
      : `Sem contato há ${daysSinceContact} dias`;
    return {
      level: 'high',
      label: 'Alta',
      description: reason,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      icon: AlertTriangle,
      pulse: true,
    };
  }

  // Medium: Moderate score or moderate time without contact
  if (score < 60 || (daysSinceContact !== null && daysSinceContact > 14)) {
    const reason = score < 60 
      ? `Score moderado (${score})` 
      : `Sem contato há ${daysSinceContact} dias`;
    return {
      level: 'medium',
      label: 'Média',
      description: reason,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info',
      icon: Clock,
      pulse: false,
    };
  }

  // Low: Good score but could use attention
  if (score < 80 || (daysSinceContact !== null && daysSinceContact > 7)) {
    return {
      level: 'low',
      label: 'Baixa',
      description: 'Relacionamento estável',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary',
      icon: CheckCircle2,
      pulse: false,
    };
  }

  // Healthy: Great score and recent contact
  return {
    level: 'healthy',
    label: 'Saudável',
    description: 'Relacionamento excelente',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success',
    icon: CheckCircle2,
    pulse: false,
  };
}

export function PriorityIndicator({ 
  relationshipScore, 
  lastInteractionDate, 
  className,
  showTooltip = true 
}: PriorityIndicatorProps) {
  const daysSinceContact = lastInteractionDate 
    ? differenceInDays(new Date(), new Date(lastInteractionDate))
    : null;

  const priority = calculatePriority(relationshipScore, daysSinceContact);
  const Icon = priority.icon;

  const indicator = (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'w-6 h-6',
        priority.bgColor,
        priority.color,
        className
      )}
    >
      {priority.pulse && (
        <span className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          priority.level === 'critical' ? 'bg-destructive animate-ping' : 'bg-warning animate-ping'
        )} style={{ animationDuration: '2s' }} />
      )}
      <Icon className="w-3.5 h-3.5 relative z-10" />
    </motion.div>
  );

  if (!showTooltip) return indicator;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {indicator}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className={cn('font-semibold', priority.color)}>
              Prioridade {priority.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {priority.description}
            </p>
            {daysSinceContact !== null && daysSinceContact > 0 && (
              <p className="text-xs text-muted-foreground">
                Último contato: {daysSinceContact} {daysSinceContact === 1 ? 'dia' : 'dias'} atrás
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact bar version for card headers
export function PriorityBar({ 
  relationshipScore, 
  lastInteractionDate,
  className 
}: Omit<PriorityIndicatorProps, 'showTooltip'>) {
  const daysSinceContact = lastInteractionDate 
    ? differenceInDays(new Date(), new Date(lastInteractionDate))
    : null;

  const priority = calculatePriority(relationshipScore, daysSinceContact);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-1 w-full rounded-full origin-left',
              priority.level === 'critical' && 'bg-destructive',
              priority.level === 'high' && 'bg-warning',
              priority.level === 'medium' && 'bg-info',
              priority.level === 'low' && 'bg-primary',
              priority.level === 'healthy' && 'bg-success',
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className={cn('font-semibold', priority.color)}>
              Prioridade {priority.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {priority.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
