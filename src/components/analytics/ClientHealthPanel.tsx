import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, Clock, MessageSquare, Smile, Target } from 'lucide-react';
import { useClientHealth } from '@/hooks/useClientHealth';
import { Contact, Interaction } from '@/types';

interface ClientHealthPanelProps {
  contact: Contact;
  interactions: Interaction[];
}

const statusColors = {
  healthy: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20'
};

const riskColors = {
  low: 'bg-success text-success-foreground',
  medium: 'bg-warning text-warning-foreground',
  high: 'bg-destructive text-destructive-foreground',
  critical: 'bg-destructive text-destructive-foreground'
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-success" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export function ClientHealthPanel({ contact, interactions }: ClientHealthPanelProps) {
  const health = useClientHealth(contact, interactions);

  if (!health) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Saúde do Cliente
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={riskColors[health.riskLevel]}>
                Risco: {health.riskLevel.toUpperCase()}
              </Badge>
              <Badge variant={health.nextActionUrgency === 'immediate' ? 'destructive' : 'outline'}>
                {health.nextActionUrgency === 'immediate' ? '🚨 Urgente' : health.nextActionUrgency === 'soon' ? '⚡ Em breve' : '✓ Normal'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Score */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Score Geral de Saúde</span>
                <span className="text-2xl font-bold">{health.overallScore}%</span>
              </div>
              <Progress value={health.overallScore} className="h-3" />
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[health.overallStatus]}`}>
              {health.overallStatus === 'healthy' ? 'Saudável' : health.overallStatus === 'warning' ? 'Atenção' : 'Crítico'}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{health.lastContactDays}d</div>
              <div className="text-xs text-muted-foreground">Último contato</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{health.contactFrequency.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Interações/mês</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{health.engagementLevel}</div>
              <div className="text-xs text-muted-foreground">Engajamento</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{health.churnProbability}%</div>
              <div className="text-xs text-muted-foreground">Prob. Churn</div>
            </div>
          </div>

          {/* Indicators */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Indicadores de Saúde</h4>
            <div className="grid gap-2">
              {health.indicators.map((indicator, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-3 p-2 rounded-lg border ${statusColors[indicator.status]}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{indicator.name}</span>
                            <TrendIcon trend={indicator.trend} />
                          </div>
                          <span className="text-xs opacity-70">{indicator.description}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{indicator.score}%</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{indicator.details}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Risk Factors */}
          {health.riskFactors.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Fatores de Risco</span>
              </div>
              <ul className="space-y-1">
                {health.riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-destructive/80">• {factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Smile className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Recomendações</span>
            </div>
            <ul className="space-y-1">
              {health.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
