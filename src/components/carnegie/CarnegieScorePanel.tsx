// ==============================================
// CARNEGIE SCORE PANEL
// Unified visualization of Carnegie principles
// ==============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Target, 
  MessageSquare, 
  Award, 
  Shield, 
  TrendingUp,
  Sparkles,
  Users,
  Star,
  Zap
} from 'lucide-react';
import { CarnegieScore } from '@/types/carnegie';
import { cn } from '@/lib/utils';
import { MorphingNumber } from '@/components/micro-interactions';

interface CarnegieScorePanelProps {
  score: CarnegieScore;
  className?: string;
}

const LEVEL_CONFIG = {
  novice: { label: 'Novato', color: 'text-muted-foreground', bg: 'bg-muted' },
  developing: { label: 'Em Desenvolvimento', color: 'text-warning', bg: 'bg-warning/10' },
  proficient: { label: 'Proficiente', color: 'text-primary', bg: 'bg-primary/10' },
  expert: { label: 'Especialista', color: 'text-success', bg: 'bg-success/10' },
  master: { label: 'Mestre Carnegie', color: 'text-accent-foreground', bg: 'bg-accent' }
};

const COMPONENT_ICONS = {
  nobleCause: Target,
  identityLabeling: Award,
  appreciation: Heart,
  talkRatio: MessageSquare,
  warmth: Sparkles,
  faceSaving: Shield,
  vulnerability: Users,
  progressCelebration: TrendingUp
};

const COMPONENT_LABELS = {
  nobleCause: 'Causa Nobre',
  identityLabeling: 'Rótulo de Identidade',
  appreciation: 'Apreciação',
  talkRatio: 'Proporção de Fala',
  warmth: 'Calor Humano',
  faceSaving: 'Salvar a Face',
  vulnerability: 'Vulnerabilidade',
  progressCelebration: 'Celebrar Progresso'
};

export function CarnegieScorePanel({ score, className }: CarnegieScorePanelProps) {
  const levelConfig = LEVEL_CONFIG[score.level];
  
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-primary';
    if (value >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-success';
    if (value >= 60) return 'bg-primary';
    if (value >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-warning" />
            Carnegie Score
          </CardTitle>
          <Badge className={cn(levelConfig.bg, levelConfig.color, "font-medium")}>
            {levelConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <MorphingNumber 
                  value={score.overall} 
                  className={cn("text-4xl font-bold", getScoreColor(score.overall))}
                />
                <span className="text-xs text-muted-foreground block">de 100</span>
              </div>
            </div>
            <div 
              className="absolute inset-0 rounded-full border-8 border-transparent"
              style={{
                borderTopColor: 'hsl(var(--primary))',
                borderRightColor: score.overall > 25 ? 'hsl(var(--primary))' : 'transparent',
                borderBottomColor: score.overall > 50 ? 'hsl(var(--primary))' : 'transparent',
                borderLeftColor: score.overall > 75 ? 'hsl(var(--primary))' : 'transparent',
                transform: `rotate(${(score.overall / 100) * 360}deg)`,
                transition: 'transform 1s ease-out'
              }}
            />
          </div>
        </div>

        {/* Component Scores */}
        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Componentes</TabsTrigger>
            <TabsTrigger value="strengths">Forças</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-3 mt-4">
            {Object.entries(score.components).map(([key, value]) => {
              const Icon = COMPONENT_ICONS[key as keyof typeof COMPONENT_ICONS];
              const label = COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS];
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{label}</span>
                    </div>
                    <span className={cn("font-medium", getScoreColor(value))}>
                      {value}%
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", getProgressColor(value))}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="strengths" className="mt-4">
            <div className="space-y-4">
              {score.strengths.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-success flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Seus Pontos Fortes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {score.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="outline" className="bg-success/10 text-success border-success/20">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Continue praticando para desenvolver seus pontos fortes!
                </p>
              )}

              {score.areasForImprovement.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-warning flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Áreas para Melhorar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {score.areasForImprovement.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            {score.priorityActions.length > 0 ? (
              <div className="space-y-3">
                {score.priorityActions.map((action, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{action.area}</p>
                        <p className="text-xs text-muted-foreground mt-1">{action.action}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          Impacto: {action.impact === 'high' ? 'Alto' : action.impact === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                    </div>
                    {action.template && (
                      <div className="mt-2 p-2 bg-background rounded text-xs italic text-muted-foreground">
                        "{action.template}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma ação prioritária no momento. Continue assim!
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
