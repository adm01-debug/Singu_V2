import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertOctagon, 
  Eye, 
  MessageSquare, 
  TrendingDown,
  Search,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { getDISCProfile, getContactBehavior } from '@/lib/contact-utils';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface Incongruence {
  id: string;
  type: 'verbal_behavioral' | 'stated_actual' | 'timeline' | 'emotion_content';
  severity: 'high' | 'medium' | 'low';
  description: string;
  verbalIndicator: string;
  behavioralIndicator: string;
  possibleMeaning: string;
  suggestedProbe: string;
}

interface IncongruenceDetectorProps {
  contact?: Contact;
  interactions?: Array<{
    content: string;
    sentiment?: string;
    created_at: string;
  }>;
  className?: string;
}

const INCONGRUENCE_PATTERNS = {
  verbal_behavioral: {
    title: 'Verbal vs Comportamental',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-destructive'
  },
  stated_actual: {
    title: 'Declarado vs Real',
    icon: <Eye className="h-4 w-4" />,
    color: 'text-accent'
  },
  timeline: {
    title: 'Inconsistência Temporal',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-warning'
  },
  emotion_content: {
    title: 'Emoção vs Conteúdo',
    icon: <AlertOctagon className="h-4 w-4" />,
    color: 'text-secondary'
  }
};

const IncongruenceDetector: React.FC<IncongruenceDetectorProps> = ({
  contact: providedContact,
  interactions = [],
  className
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const contact = providedContact || DEMO_CONTACT;

  const discProfile = (getDISCProfile(contact) as DISCProfile) || 'D';

  // Detect incongruences based on patterns
  const detectedIncongruences = useMemo((): Incongruence[] => {
    const incongruences: Incongruence[] = [];

    // Pattern 1: High relationship score but negative sentiment in recent interactions
    const recentNegative = interactions.slice(0, 5).filter(i => 
      i.sentiment === 'negative' || i.sentiment === 'very_negative'
    );
    
    if ((contact.relationshipScore || 0) > 70 && recentNegative.length >= 2) {
      incongruences.push({
        id: 'inc-1',
        type: 'verbal_behavioral',
        severity: 'high',
        description: 'Score alto de relacionamento mas sentimento negativo recente',
        verbalIndicator: `Relacionamento marcado como ${contact.relationshipScore}%`,
        behavioralIndicator: `${recentNegative.length} interações negativas recentes`,
        possibleMeaning: 'Cliente pode estar insatisfeito mas não expressando diretamente, ou relacionamento está deteriorando',
        suggestedProbe: `${contact.firstName}, tenho percebido uma mudança em nossas conversas. Há algo que eu possa fazer diferente?`
      });
    }

    // Pattern 2: Says "yes" but behavior shows hesitation
    const hesitationWords = ['talvez', 'vou pensar', 'depois vejo', 'não sei', 'preciso ver'];
    const positiveWords = ['sim', 'claro', 'pode ser', 'interessante'];
    
    interactions.forEach((interaction, idx) => {
      if (!interaction.content) return;
      const lower = interaction.content.toLowerCase();
      
      const hasPositive = positiveWords.some(w => lower.includes(w));
      const hasHesitation = hesitationWords.some(w => lower.includes(w));
      
      if (hasPositive && hasHesitation) {
        incongruences.push({
          id: `inc-hesitation-${idx}`,
          type: 'stated_actual',
          severity: 'medium',
          description: 'Concordância verbal com hesitação subjacente',
          verbalIndicator: 'Disse "sim" ou mostrou interesse',
          behavioralIndicator: 'Usou palavras de adiamento ou incerteza',
          possibleMeaning: 'Resistência não expressa, possível objeção oculta ou pressão social para concordar',
          suggestedProbe: 'Percebo que você tem algumas dúvidas. O que exatamente está te fazendo pensar duas vezes?'
        });
      }
    });

    // Pattern 3: DISC-based incongruence
    if (discProfile === 'D') {
      const longInteractions = interactions.filter(i => 
        i.content && i.content.length > 500
      );
      if (longInteractions.length > 3) {
        incongruences.push({
          id: 'inc-disc-d',
          type: 'verbal_behavioral',
          severity: 'low',
          description: 'Perfil D com comunicação prolongada',
          verbalIndicator: 'Perfil DISC indica preferência por comunicação direta',
          behavioralIndicator: 'Múltiplas interações longas e detalhadas',
          possibleMeaning: 'Pode estar processando decisão complexa, ou perfil DISC precisa recalibração',
          suggestedProbe: 'Vou resumir os pontos principais. Qual é o fator decisivo para você?'
        });
      }
    }

    // Pattern 4: Emotion vs Content
    const emotionalContent = interactions.filter(i => {
      if (!i.content) return false;
      const hasEmotionalWords = /animado|empolgado|feliz|ótimo|incrível/i.test(i.content);
      const isNegativeSentiment = i.sentiment === 'negative';
      return hasEmotionalWords && isNegativeSentiment;
    });

    if (emotionalContent.length > 0) {
      incongruences.push({
        id: 'inc-emotion',
        type: 'emotion_content',
        severity: 'high',
        description: 'Palavras positivas mas sentimento detectado como negativo',
        verbalIndicator: 'Usa linguagem entusiástica e positiva',
        behavioralIndicator: 'Análise de sentimento indica negatividade',
        possibleMeaning: 'Possível sarcasmo, mascaramento de frustração, ou cliente tentando ser educado',
        suggestedProbe: 'Quero ter certeza de que estou entendendo você corretamente. O que você realmente acha?'
      });
    }

    // Pattern 5: Timeline inconsistency
    if (interactions.length > 5) {
      const sentiments = interactions.slice(0, 5).map(i => i.sentiment);
      const isErratic = sentiments.filter((s, i, arr) => 
        i > 0 && s !== arr[i-1]
      ).length >= 3;

      if (isErratic) {
        incongruences.push({
          id: 'inc-timeline',
          type: 'timeline',
          severity: 'medium',
          description: 'Mudanças bruscas de sentimento',
          verbalIndicator: 'Padrão de sentimento instável nas interações',
          behavioralIndicator: `${sentiments.filter((s, i, arr) => i > 0 && s !== arr[i-1]).length} mudanças de sentimento em 5 interações`,
          possibleMeaning: 'Cliente pode estar passando por momento de decisão, influência externa, ou instabilidade situacional',
          suggestedProbe: 'Noto que nossa conversa tem tido altos e baixos. Há algo acontecendo que eu deveria saber?'
        });
      }
    }

    return incongruences.slice(0, 10);
  }, [contact, interactions, discProfile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-info/20 text-info border-info/30';
    }
  };

  const overallCongruence = 100 - (detectedIncongruences.length * 15);
  const displayedIncongruences = showAll 
    ? detectedIncongruences 
    : detectedIncongruences.slice(0, 3);

  return (
    <Card className={cn("border-accent/30 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertOctagon className="h-5 w-5 text-accent" />
            Detector de Incongruências
          </CardTitle>
          <Badge variant="outline" className={cn(
            overallCongruence >= 80 ? 'bg-success/20 text-success' :
            overallCongruence >= 60 ? 'bg-warning/20 text-warning' :
            'bg-destructive/20 text-destructive'
          )}>
            {Math.max(0, overallCongruence)}% Congruente
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Identifica quando linguagem verbal não alinha com padrões comportamentais
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Congruence Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Índice de Congruência</span>
            <span className="font-medium">{Math.max(0, overallCongruence)}%</span>
          </div>
          <Progress value={Math.max(0, overallCongruence)} className="h-2" />
        </div>

        {/* Incongruences List */}
        {detectedIncongruences.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma incongruência significativa detectada</p>
            <p className="text-xs mt-1">Comunicação parece autêntica e consistente</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedIncongruences.map((inc, idx) => (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-muted/30 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={INCONGRUENCE_PATTERNS[inc.type].color}>
                        {INCONGRUENCE_PATTERNS[inc.type].icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{inc.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {INCONGRUENCE_PATTERNS[inc.type].title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getSeverityColor(inc.severity)}>
                        {inc.severity === 'high' ? 'Alta' : inc.severity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      {expandedId === inc.id ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === inc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/50 rounded p-2">
                            <div className="text-muted-foreground mb-1">Indicador Verbal</div>
                            <div>{inc.verbalIndicator}</div>
                          </div>
                          <div className="bg-muted/50 rounded p-2">
                            <div className="text-muted-foreground mb-1">Indicador Comportamental</div>
                            <div>{inc.behavioralIndicator}</div>
                          </div>
                        </div>

                        <div className="bg-accent/10 rounded p-2 text-sm">
                          <div className="flex items-center gap-1 text-accent font-medium mb-1">
                            <Lightbulb className="h-3 w-3" />
                            Possível Significado
                          </div>
                          <p className="text-muted-foreground text-xs">{inc.possibleMeaning}</p>
                        </div>

                        <div className="bg-secondary/10 rounded p-2">
                          <div className="text-secondary font-medium text-xs mb-1">
                            💡 Pergunta Sugerida para Clarificar:
                          </div>
                          <p className="text-sm italic">"{inc.suggestedProbe}"</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {detectedIncongruences.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Ver Menos' : `Ver Mais (${detectedIncongruences.length - 3})`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncongruenceDetector;
