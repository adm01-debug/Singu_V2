import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity,
  Users,
  MessageSquare,
  Heart,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

interface HealthMetric {
  label: string;
  value: number;
  maxValue: number;
  status: 'good' | 'warning' | 'critical';
  icon: typeof Activity;
}

interface CompanyHealthScoreProps {
  financialHealth: HealthStatus;
  contactCount: number;
  avgRelationshipScore: number;
  totalInteractions: number;
  positiveInteractionsRatio: number;
  pendingFollowUps: number;
  daysSinceLastInteraction?: number;
  className?: string;
}

const healthConfig: Record<HealthStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof TrendingUp;
  description: string;
}> = {
  growing: { 
    label: 'Em Crescimento', 
    color: 'text-success', 
    bgColor: 'bg-success/10',
    icon: TrendingUp,
    description: 'Empresa em fase de expansão'
  },
  stable: { 
    label: 'Estável', 
    color: 'text-info', 
    bgColor: 'bg-info/10',
    icon: Minus,
    description: 'Situação financeira estável'
  },
  cutting: { 
    label: 'Em Retração', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    icon: TrendingDown,
    description: 'Empresa cortando custos'
  },
  unknown: { 
    label: 'Desconhecido', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    icon: Minus,
    description: 'Situação financeira não identificada'
  },
};

function calculateOverallHealth(props: CompanyHealthScoreProps): number {
  let score = 0;
  let factors = 0;

  // Financial health factor (0-25 points)
  if (props.financialHealth === 'growing') score += 25;
  else if (props.financialHealth === 'stable') score += 20;
  else if (props.financialHealth === 'cutting') score += 10;
  else score += 5;
  factors++;

  // Relationship score factor (0-25 points)
  score += (props.avgRelationshipScore / 100) * 25;
  factors++;

  // Engagement factor (0-25 points)
  const engagementScore = Math.min(props.totalInteractions / 20, 1) * 15 + 
                          props.positiveInteractionsRatio * 10;
  score += engagementScore;
  factors++;

  // Follow-up health (0-25 points)
  const followUpPenalty = Math.min(props.pendingFollowUps * 5, 15);
  const recencyPenalty = props.daysSinceLastInteraction 
    ? Math.min(props.daysSinceLastInteraction / 2, 10) 
    : 0;
  score += 25 - followUpPenalty - recencyPenalty;
  factors++;

  return Math.round(Math.max(0, Math.min(100, score)));
}

function getHealthGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 80) return { grade: 'A', color: 'text-success', label: 'Excelente' };
  if (score >= 60) return { grade: 'B', color: 'text-info', label: 'Bom' };
  if (score >= 40) return { grade: 'C', color: 'text-warning', label: 'Regular' };
  if (score >= 20) return { grade: 'D', color: 'text-accent', label: 'Atenção' };
  return { grade: 'F', color: 'text-destructive', label: 'Crítico' };
}

export function CompanyHealthScore(props: CompanyHealthScoreProps) {
  const { financialHealth, className } = props;
  const config = healthConfig[financialHealth];
  const HealthIcon = config.icon;
  
  const overallScore = calculateOverallHealth(props);
  const grade = getHealthGrade(overallScore);

  const metrics: HealthMetric[] = [
    {
      label: 'Relacionamento',
      value: props.avgRelationshipScore,
      maxValue: 100,
      status: props.avgRelationshipScore >= 70 ? 'good' : props.avgRelationshipScore >= 40 ? 'warning' : 'critical',
      icon: Heart,
    },
    {
      label: 'Engajamento',
      value: Math.round(props.positiveInteractionsRatio * 100),
      maxValue: 100,
      status: props.positiveInteractionsRatio >= 0.6 ? 'good' : props.positiveInteractionsRatio >= 0.3 ? 'warning' : 'critical',
      icon: MessageSquare,
    },
    {
      label: 'Contatos',
      value: props.contactCount,
      maxValue: 10,
      status: props.contactCount >= 3 ? 'good' : props.contactCount >= 1 ? 'warning' : 'critical',
      icon: Users,
    },
  ];

  const statusColors = {
    good: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-destructive',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Health Score
          </span>
          <Badge className={cn(config.bgColor, config.color, 'gap-1')}>
            <HealthIcon className="w-3 h-3" />
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Score Display */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={grade.color}
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - overallScore / 100) 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className={cn('text-3xl font-bold', grade.color)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {grade.grade}
              </motion.span>
              <span className="text-xs text-muted-foreground">{overallScore}%</span>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className={cn('text-lg font-semibold', grade.color)}>{grade.label}</h3>
            <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
            
            {/* Quick stats */}
            <div className="flex items-center gap-4 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{props.totalInteractions}</span>
                  </TooltipTrigger>
                  <TooltipContent>Total de interações</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{props.contactCount}</span>
                  </TooltipTrigger>
                  <TooltipContent>Contatos cadastrados</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {props.pendingFollowUps > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{props.pendingFollowUps}</span>
                    </TooltipTrigger>
                    <TooltipContent>Follow-ups pendentes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Bars */}
        <div className="space-y-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const percentage = Math.min((metric.value / metric.maxValue) * 100, 100);
            
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" />
                    {metric.label}
                  </span>
                  <span className="font-medium">
                    {metric.value}{metric.maxValue === 100 ? '%' : `/${metric.maxValue}`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', statusColors[metric.status])}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Health Indicators */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Indicadores</span>
            <div className="flex items-center gap-2">
              {props.avgRelationshipScore >= 70 && (
                <Badge variant="outline" className="text-success border-success/30 gap-1 text-xs py-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Bom relacionamento
                </Badge>
              )}
              {props.pendingFollowUps > 2 && (
                <Badge variant="outline" className="text-warning border-warning/30 gap-1 text-xs py-0">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção aos follow-ups
                </Badge>
              )}
              {props.contactCount === 0 && (
                <Badge variant="outline" className="text-destructive border-destructive/30 gap-1 text-xs py-0">
                  <XCircle className="w-3 h-3" />
                  Sem contatos
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyHealthBadge({ 
  financialHealth, 
  size = 'md' 
}: { 
  financialHealth: HealthStatus; 
  size?: 'sm' | 'md' | 'lg';
}) {
  const config = healthConfig[financialHealth];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <Badge className={cn(config.bgColor, config.color, 'gap-1', sizeClasses[size])}>
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
}
