// ==============================================
// PROGRESS CELEBRATION PANEL
// Praise every improvement
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Zap,
  Target,
  PartyPopper
} from 'lucide-react';
import { PROGRESS_CELEBRATIONS } from '@/data/carnegieProgressCelebration';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { toast } from 'sonner';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProgressCelebrationPanelProps {
  contact?: Contact | null;
  className?: string;
}

const TYPE_LABELS = {
  milestone_reached: 'Marco Alcançado',
  goal_achieved: 'Meta Atingida',
  improvement_noted: 'Melhoria Notada',
  challenge_overcome: 'Desafio Superado',
  skill_developed: 'Habilidade Desenvolvida',
  decision_made: 'Decisão Tomada',
  step_completed: 'Etapa Concluída',
  habit_formed: 'Hábito Formado',
  breakthrough: 'Avanço',
  consistency: 'Consistência'
};

const TYPE_ICONS = {
  milestone_reached: Target,
  goal_achieved: Trophy,
  improvement_noted: Sparkles,
  challenge_overcome: Zap,
  skill_developed: Star,
  decision_made: Target,
  step_completed: Target,
  habit_formed: Star,
  breakthrough: Zap,
  consistency: Star
};

export function ProgressCelebrationPanel({ contact = null, className }: ProgressCelebrationPanelProps) {
  const { discProfile } = useCarnegieAnalysis(contact);
  const [expandedCelebration, setExpandedCelebration] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error('Não foi possível copiar'));
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-warning" />
            Celebração de Progresso
          </CardTitle>
          <Badge variant="outline">Perfil {discProfile}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          "Elogie cada melhoria, por menor que seja" - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Celebration Templates */}
        <div className="space-y-3">
          {PROGRESS_CELEBRATIONS.map((celebration) => {
            const isExpanded = expandedCelebration === celebration.id;
            const Icon = TYPE_ICONS[celebration.type] || Trophy;

            return (
              <Collapsible 
                key={celebration.id}
                open={isExpanded}
                onOpenChange={() => setExpandedCelebration(isExpanded ? null : celebration.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left">
                      <div className="p-2 rounded-full bg-warning/10 shrink-0">
                        <Icon className="h-4 w-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm">{celebration.name}</h4>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {celebration.description}
                        </p>
                        <Badge variant="outline" className="text-xs mt-2 bg-warning/10 text-warning">
                          {TYPE_LABELS[celebration.type]}
                        </Badge>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-4 border-t bg-muted/30">
                      {/* Intensity Levels */}
                      <div className="pt-3">
                        <h5 className="text-xs font-medium flex items-center gap-1 mb-2">
                          <PartyPopper className="h-3 w-3 text-warning" />
                          Níveis de Intensidade
                        </h5>
                        <Tabs defaultValue="standard" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="micro" className="text-xs">Micro</TabsTrigger>
                            <TabsTrigger value="standard" className="text-xs">Padrão</TabsTrigger>
                            <TabsTrigger value="major" className="text-xs">Grande</TabsTrigger>
                          </TabsList>
                          <TabsContent value="micro" className="mt-2">
                            <div className="p-2 rounded bg-background border">
                              <p className="text-xs italic text-muted-foreground">
                                "{celebration.microCelebration}"
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2 h-6 text-xs"
                                onClick={() => copyToClipboard(celebration.microCelebration, 'Celebração micro')}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent value="standard" className="mt-2">
                            <div className="p-2 rounded bg-background border">
                              <p className="text-xs italic text-muted-foreground">
                                "{celebration.standardCelebration}"
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2 h-6 text-xs"
                                onClick={() => copyToClipboard(celebration.standardCelebration, 'Celebração padrão')}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent value="major" className="mt-2">
                            <div className="p-2 rounded bg-background border">
                              <p className="text-xs italic text-muted-foreground">
                                "{celebration.majorCelebration}"
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2 h-6 text-xs"
                                onClick={() => copyToClipboard(celebration.majorCelebration, 'Celebração grande')}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Celebration Phases */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Estrutura de Celebração
                        </h5>
                        <div className="grid gap-2">
                          <div className="p-2 rounded bg-success/5 border border-success/20">
                            <span className="text-xs font-medium text-success">Reconhecimento:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{celebration.recognitionPhrase}"
                            </p>
                          </div>
                          <div className="p-2 rounded bg-primary/5 border border-primary/20">
                            <span className="text-xs font-medium text-primary">Amplificação:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{celebration.amplificationPhrase}"
                            </p>
                          </div>
                          <div className="p-2 rounded bg-warning/5 border border-warning/20">
                            <span className="text-xs font-medium text-warning">Projeção Futura:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{celebration.futureProjection}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Full Script */}
                      <div className="p-3 rounded-lg bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Script Completo de Celebração</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => copyToClipboard(celebration.fullScript, 'Script completo')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <p className="text-xs italic text-muted-foreground">
                          "{celebration.fullScript}"
                        </p>
                      </div>

                      {/* Follow-up */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-background border">
                          <span className="text-xs font-medium text-primary">Pergunta de Follow-up:</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            "{celebration.followUpQuestion}"
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full mt-1 h-6 text-xs"
                            onClick={() => copyToClipboard(celebration.followUpQuestion, 'Pergunta')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <div className="p-2 rounded bg-background border">
                          <span className="text-xs font-medium text-primary">Próximo Passo:</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            "{celebration.nextStepSuggestion}"
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full mt-1 h-6 text-xs"
                            onClick={() => copyToClipboard(celebration.nextStepSuggestion, 'Sugestão')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
