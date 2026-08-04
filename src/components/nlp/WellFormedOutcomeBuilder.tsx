import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  CheckCircle2,
  Circle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { DEMO_CONTACT } from '@/domain/demoEntities';

interface OutcomeCriterion {
  id: string;
  name: string;
  question: string;
  probeQuestion: string;
  answer?: string;
  isComplete: boolean;
}

interface WellFormedOutcomeBuilderProps {
  contact?: Contact;
  className?: string;
}

const OUTCOME_CRITERIA: Omit<OutcomeCriterion, 'answer' | 'isComplete'>[] = [
  {
    id: 'positive',
    name: 'Positivo',
    question: 'O que você QUER (não o que não quer)?',
    probeQuestion: 'Em vez de evitar X, o que você gostaria de ter/fazer/ser?'
  },
  {
    id: 'sensory',
    name: 'Evidência Sensorial',
    question: 'Como você vai SABER que conseguiu?',
    probeQuestion: 'O que você vai ver, ouvir ou sentir quando atingir este objetivo?'
  },
  {
    id: 'self-initiated',
    name: 'Auto-Iniciado',
    question: 'O que VOCÊ pode fazer para conseguir isso?',
    probeQuestion: 'O que está sob seu controle direto? O que você precisa iniciar?'
  },
  {
    id: 'context',
    name: 'Contexto Específico',
    question: 'Onde, quando e com quem você quer isso?',
    probeQuestion: 'Em que situações específicas você quer este resultado?'
  },
  {
    id: 'resources',
    name: 'Recursos',
    question: 'O que você precisa para conseguir?',
    probeQuestion: 'Quais recursos (tempo, dinheiro, pessoas, habilidades) você já tem ou precisa?'
  },
  {
    id: 'ecology',
    name: 'Ecologia',
    question: 'Como isso afeta outras áreas da sua vida?',
    probeQuestion: 'Há algum custo ou consequência negativa? O que você pode perder?'
  },
  {
    id: 'first-step',
    name: 'Primeiro Passo',
    question: 'Qual é a PRIMEIRA ação concreta?',
    probeQuestion: 'O que você pode fazer nas próximas 24-48 horas para começar?'
  }
];

const WellFormedOutcomeBuilder: React.FC<WellFormedOutcomeBuilderProps> = ({
  contact,
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [criteria, setCriteria] = useState<OutcomeCriterion[]>(
    OUTCOME_CRITERIA.map(c => ({ ...c, answer: '', isComplete: false }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const currentCriterion = criteria[currentIndex];
  const completedCount = criteria.filter(c => c.isComplete).length;
  const progress = (completedCount / criteria.length) * 100;

  const updateAnswer = (answer: string) => {
    setCriteria(prev => prev.map((c, i) => 
      i === currentIndex 
        ? { ...c, answer, isComplete: answer.trim().length > 10 }
        : c
    ));
  };

  const goToNext = () => {
    if (currentIndex < criteria.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const reset = () => {
    setCriteria(OUTCOME_CRITERIA.map(c => ({ ...c, answer: '', isComplete: false })));
    setCurrentIndex(0);
    setShowSummary(false);
  };

  const generateOutcomeStatement = () => {
    if (completedCount < 3) return null;

    const positive = criteria.find(c => c.id === 'positive')?.answer || '';
    const sensory = criteria.find(c => c.id === 'sensory')?.answer || '';
    const firstStep = criteria.find(c => c.id === 'first-step')?.answer || '';

    return `${activeContact.firstName} quer ${positive}. Saberá que conseguiu quando ${sensory}. O primeiro passo é ${firstStep}.`;
  };

  return (
    <Card className={cn("border-success/20 bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-success" />
            Well-Formed Outcome Builder
          </CardTitle>
          <Badge variant="outline" className="bg-success/10 text-success">
            {completedCount}/{criteria.length} critérios
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Construa objetivos bem formados com {activeContact.firstName} usando os 7 critérios PNL
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso do Objetivo</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Criteria Navigation */}
        <div className="flex gap-1 flex-wrap">
          {criteria.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => {
                setCurrentIndex(idx);
                setShowSummary(false);
              }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                idx === currentIndex && !showSummary
                  ? 'bg-success text-success-foreground'
                  : c.isComplete
                  ? 'bg-success/30 text-success'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {c.isComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </button>
          ))}
          <button
            onClick={() => setShowSummary(true)}
            className={cn(
              "px-3 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
              showSummary
                ? 'bg-success text-success-foreground'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Resumo
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showSummary ? (
            <motion.div
              key={currentCriterion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Current Criterion */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {currentCriterion.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h4 className="font-medium">{currentCriterion.name}</h4>
                  <Badge variant="outline" className="ml-auto">
                    {currentIndex + 1} de {criteria.length}
                  </Badge>
                </div>

                <div className="bg-success/10 rounded p-3 mb-3">
                  <div className="text-sm font-medium text-success mb-1">
                    Pergunta Chave:
                  </div>
                  <p className="text-sm">{currentCriterion.question}</p>
                </div>

                <div className="bg-muted/50 rounded p-3 mb-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Lightbulb className="h-3 w-3" />
                    Pergunta de Sondagem:
                  </div>
                  <p className="text-xs italic">"{currentCriterion.probeQuestion}"</p>
                </div>

                <Textarea
                  placeholder={`Resposta de ${activeContact.firstName}...`}
                  value={currentCriterion.answer}
                  onChange={(e) => updateAnswer(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={goToNext}
                >
                  {currentIndex === criteria.length - 1 ? 'Ver Resumo' : 'Próximo'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-success/10 rounded-lg p-4 border border-success/20">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-success" />
                  Objetivo Bem Formado de {activeContact.firstName}
                </h4>

                {completedCount < 3 ? (
                  <p className="text-sm text-muted-foreground">
                    Complete pelo menos 3 critérios para gerar o resumo do objetivo.
                  </p>
                ) : (
                  <>
                    <p className="text-sm italic mb-4">
                      "{generateOutcomeStatement()}"
                    </p>

                    <div className="space-y-2">
                      {criteria.filter(c => c.isComplete).map(c => (
                        <div key={c.id} className="bg-muted/30 rounded p-2">
                          <div className="text-xs font-medium text-success">{c.name}</div>
                          <p className="text-xs text-muted-foreground">{c.answer}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Incomplete Criteria Warning */}
              {completedCount < criteria.length && (
                <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                  <div className="text-xs text-warning font-medium mb-2">
                    Critérios Pendentes:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {criteria.filter(c => !c.isComplete).map(c => (
                      <Button
                        key={c.id}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => {
                          setCurrentIndex(criteria.findIndex(cr => cr.id === c.id));
                          setShowSummary(false);
                        }}
                      >
                        {c.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                <RefreshCw className="h-3 w-3 mr-1" />
                Reiniciar Processo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default WellFormedOutcomeBuilder;
