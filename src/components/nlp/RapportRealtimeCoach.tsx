import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Eye, 
  Ear, 
  Hand, 
  Brain,
  Zap,
  MessageSquare,
  Volume2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface RapportSuggestion {
  category: 'mirroring' | 'pacing' | 'leading' | 'language';
  title: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

interface RapportRealtimeCoachProps {
  contact?: Contact;
  currentMessage?: string;
  onSuggestionApply?: (suggestion: string) => void;
  className?: string;
}

const VAK_PREDICATES = {
  V: ['ver', 'olhar', 'visualizar', 'claro', 'brilhante', 'perspectiva', 'foco', 'imagem', 'mostrar', 'aparecer', 'visão', 'ilustrar'],
  A: ['ouvir', 'escutar', 'soar', 'dizer', 'falar', 'ressoar', 'harmonia', 'silêncio', 'tom', 'ritmo', 'melodia', 'eco'],
  K: ['sentir', 'tocar', 'pegar', 'concreto', 'firme', 'sólido', 'pressão', 'impacto', 'sensação', 'peso', 'textura', 'abraçar'],
  D: ['analisar', 'lógico', 'considerar', 'entender', 'processo', 'função', 'conceito', 'dados', 'fazer sentido', 'experiência', 'aprender']
};

const DISC_PACE = {
  D: { speed: 'rápido', style: 'direto', focus: 'resultados' },
  I: { speed: 'animado', style: 'entusiasta', focus: 'pessoas' },
  S: { speed: 'calmo', style: 'paciente', focus: 'segurança' },
  C: { speed: 'metódico', style: 'preciso', focus: 'detalhes' }
};

const RapportRealtimeCoach: React.FC<RapportRealtimeCoachProps> = ({
  contact: providedContact,
  currentMessage = '',
  onSuggestionApply,
  className
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const contact = providedContact || DEMO_CONTACT;

  const vakType = getDominantVAK(contact) as VAKType || 'V';
  const discProfile = (getDISCProfile(contact) as DISCProfile) || 'D';
  const discPace = DISC_PACE[discProfile];

  // Analyze current message for rapport alignment
  const rapportAnalysis = useMemo(() => {
    if (!currentMessage || currentMessage.length < 10) {
      return { score: 0, issues: [], suggestions: [] };
    }

    const lowerMessage = currentMessage.toLowerCase();
    let score = 50;
    const issues: string[] = [];
    const suggestions: RapportSuggestion[] = [];

    // Check VAK alignment
    const targetPredicates = VAK_PREDICATES[vakType];
    const wrongPredicates = Object.entries(VAK_PREDICATES)
      .filter(([key]) => key !== vakType)
      .flatMap(([, words]) => words);

    let targetMatches = 0;
    let wrongMatches = 0;

    targetPredicates.forEach(word => {
      if (lowerMessage.includes(word)) targetMatches++;
    });

    wrongPredicates.forEach(word => {
      if (lowerMessage.includes(word)) wrongMatches++;
    });

    if (targetMatches > 0) {
      score += targetMatches * 10;
    }

    if (wrongMatches > targetMatches) {
      issues.push(`Usando predicados ${vakType === 'V' ? 'não-visuais' : vakType === 'A' ? 'não-auditivos' : vakType === 'K' ? 'não-cinestésicos' : 'não-digitais'} para um cliente ${vakType}`);
      suggestions.push({
        category: 'language',
        title: 'Ajuste de Predicados',
        suggestion: `Substitua por palavras ${vakType === 'V' ? 'visuais (ver, olhar, claro)' : vakType === 'A' ? 'auditivas (ouvir, soar, harmonia)' : vakType === 'K' ? 'cinestésicas (sentir, tocar, concreto)' : 'digitais (analisar, entender, processo)'}`,
        priority: 'high',
        icon: vakType === 'V' ? <Eye className="h-4 w-4" /> : vakType === 'A' ? <Ear className="h-4 w-4" /> : vakType === 'K' ? <Hand className="h-4 w-4" /> : <Brain className="h-4 w-4" />
      });
      score -= 15;
    }

    // Check message length for DISC
    const wordCount = currentMessage.split(/\s+/).length;
    
    if (discProfile === 'D' && wordCount > 50) {
      issues.push('Mensagem muito longa para um perfil D (Dominante)');
      suggestions.push({
        category: 'pacing',
        title: 'Encurte a Mensagem',
        suggestion: 'Perfil D prefere comunicação direta. Reduza para menos de 30 palavras focando em resultados.',
        priority: 'high',
        icon: <Zap className="h-4 w-4" />
      });
      score -= 10;
    }

    if (discProfile === 'C' && wordCount < 20 && !currentMessage.includes('dado') && !currentMessage.includes('análise')) {
      issues.push('Falta de detalhes para um perfil C (Consciente)');
      suggestions.push({
        category: 'pacing',
        title: 'Adicione Dados',
        suggestion: 'Perfil C valoriza precisão. Inclua números, dados ou análises específicas.',
        priority: 'medium',
        icon: <Activity className="h-4 w-4" />
      });
      score -= 5;
    }

    // Check for rapport phrases
    if (!lowerMessage.includes(contact.firstName.toLowerCase())) {
      suggestions.push({
        category: 'mirroring',
        title: 'Use o Nome',
        suggestion: `Inclua "${contact.firstName}" na mensagem para criar conexão pessoal.`,
        priority: 'medium',
        icon: <Users className="h-4 w-4" />
      });
    }

    // Pacing suggestions based on DISC
    suggestions.push({
      category: 'leading',
      title: `Ritmo ${discPace.style}`,
      suggestion: `Para perfil ${discProfile}: mantenha ritmo ${discPace.speed}, foco em ${discPace.focus}.`,
      priority: 'low',
      icon: <MessageSquare className="h-4 w-4" />
    });

    // Voice/tone suggestion
    if (vakType === 'A') {
      suggestions.push({
        category: 'mirroring',
        title: 'Variação Tonal',
        suggestion: 'Cliente Auditivo: use vírgulas e pontos para criar ritmo. Varie o "tom" escrito.',
        priority: 'medium',
        icon: <Volume2 className="h-4 w-4" />
      });
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      issues,
      suggestions: suggestions.slice(0, 5)
    };
  }, [currentMessage, vakType, discProfile, contact.firstName, discPace]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/15 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/15 text-warning border-warning/20';
      default: return 'bg-info/15 text-info border-info/20';
    }
  };

  return (
    <Card className={cn("border-secondary/20 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-secondary" />
            Rapport Real-Time Coach
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-secondary/10 text-secondary">
              VAK: {vakType}
            </Badge>
            <Badge variant="outline" className="bg-info/10 text-info">
              DISC: {discProfile}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Análise em tempo real do alinhamento de comunicação
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rapport Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Índice de Rapport</span>
            <span className={cn("text-lg font-bold", getScoreColor(rapportAnalysis.score))}>
              {rapportAnalysis.score}%
            </span>
          </div>
          <Progress 
            value={rapportAnalysis.score} 
            className="h-2"
          />
        </div>

        {/* Current Issues */}
        {rapportAnalysis.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Pontos de Atenção
            </h4>
            <div className="space-y-1">
              {rapportAnalysis.issues.map((issue, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-warning bg-warning/10 px-3 py-2 rounded-md"
                >
                  {issue}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-secondary" />
            Sugestões de Ajuste
          </h4>
          <AnimatePresence mode="popLayout">
            {rapportAnalysis.suggestions.map((suggestion, idx) => (
              <motion.div
                key={`${suggestion.category}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-muted/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {suggestion.icon}
                    <span className="font-medium text-sm">{suggestion.title}</span>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                {onSuggestionApply && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full mt-1"
                    onClick={() => onSuggestionApply(suggestion.suggestion)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aplicar Sugestão
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Reference */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", showAdvanced && "rotate-180")} />
          {showAdvanced ? 'Ocultar' : 'Ver'} Referência Rápida
        </Button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 text-xs"
            >
              <div className="bg-muted/30 rounded-md p-2">
                <div className="font-medium mb-1">Predicados VAK {vakType}</div>
                <div className="text-muted-foreground">
                  {VAK_PREDICATES[vakType].slice(0, 4).join(', ')}...
                </div>
              </div>
              <div className="bg-muted/30 rounded-md p-2">
                <div className="font-medium mb-1">Ritmo DISC {discProfile}</div>
                <div className="text-muted-foreground">
                  {discPace.speed}, {discPace.style}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default RapportRealtimeCoach;
