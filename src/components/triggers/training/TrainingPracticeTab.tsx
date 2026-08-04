import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Star, CheckCircle2, Lightbulb,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TrainingScenario } from '@/data/communicationTrainingData';

interface TrainingPracticeTabProps {
  scenarios: TrainingScenario[];
  currentScenario: number;
  currentScenarioData: TrainingScenario | undefined;
  selectedAnswer: string | null;
  showResult: boolean;
  score: number;
  completedScenarios: string[];
  onAnswerSelect: (id: string) => void;
  onSubmitAnswer: () => void;
  onNextScenario: () => void;
  onResetTraining: () => void;
}

export function TrainingPracticeTab({
  scenarios,
  currentScenario,
  currentScenarioData,
  selectedAnswer,
  showResult,
  score,
  completedScenarios,
  onAnswerSelect,
  onSubmitAnswer,
  onNextScenario,
  onResetTraining,
}: TrainingPracticeTabProps) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 mx-auto text-warning mb-4" />
        <p className="text-muted-foreground">
          Complete seu perfil DISC para acessar os cenários de prática.
        </p>
      </div>
    );
  }

  if (completedScenarios.length >= scenarios.length) {
    return (
      <div className="text-center py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4">
          <Trophy className="w-16 h-16 mx-auto text-warning" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Treinamento Completo! 🎉</h3>
        <p className="text-muted-foreground mb-4">
          Você acertou {score} de {scenarios.length} cenários
        </p>
        <Progress value={(score / scenarios.length) * 100} className="w-48 mx-auto mb-4" />
        <Button onClick={onResetTraining} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Recomeçar Treinamento
        </Button>
      </div>
    );
  }

  if (!currentScenarioData) return null;

  return (
    <motion.div
      key={currentScenarioData.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Cenário {currentScenario + 1} de {scenarios.length}
        </span>
        <Badge variant="secondary">
          <Star className="w-3 h-3 mr-1" />
          {score} pontos
        </Badge>
      </div>
      <Progress value={((currentScenario + 1) / scenarios.length) * 100} className="h-2" />

      {/* Scenario */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn(
            currentScenarioData.clientProfile.disc === 'D' && 'bg-destructive',
            currentScenarioData.clientProfile.disc === 'I' && 'bg-warning',
            currentScenarioData.clientProfile.disc === 'S' && 'bg-success',
            currentScenarioData.clientProfile.disc === 'C' && 'bg-info',
          )}>
            {currentScenarioData.clientProfile.disc}
          </Badge>
          <h3 className="font-semibold">{currentScenarioData.title}</h3>
        </div>

        <p className="text-sm bg-background/80 p-3 rounded italic mb-4">
          "{currentScenarioData.situation}"
        </p>

        <p className="text-xs text-muted-foreground mb-3">
          <Lightbulb className="w-3 h-3 inline mr-1" />
          Qual é a melhor resposta para este cliente?
        </p>

        <RadioGroup
          value={selectedAnswer || ''}
          onValueChange={onAnswerSelect}
          className="space-y-2"
          disabled={showResult}
        >
          {currentScenarioData.options.map((option) => (
            <Label
              key={option.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                selectedAnswer === option.id && !showResult && 'border-primary bg-primary/10',
                showResult && option.isCorrect && 'border-success/30 bg-success dark:bg-success/30',
                showResult && selectedAnswer === option.id && !option.isCorrect && 'border-destructive bg-destructive dark:bg-destructive/30',
                !showResult && 'hover:border-primary/50'
              )}
            >
              <RadioGroupItem value={option.id} className="mt-1" />
              <div className="flex-1">
                <p className="text-sm">{option.text}</p>
                {showResult && (selectedAnswer === option.id || option.isCorrect) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={cn(
                      'text-xs mt-2 p-2 rounded',
                      option.isCorrect
                        ? 'bg-success text-success dark:bg-success/50 dark:text-success'
                        : 'bg-destructive text-destructive dark:bg-destructive/50 dark:text-destructive'
                    )}
                  >
                    {option.explanation}
                  </motion.p>
                )}
              </div>
              {showResult && option.isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-success" />
              )}
            </Label>
          ))}
        </RadioGroup>

        <div className="flex justify-end gap-2 mt-4">
          {!showResult ? (
            <Button onClick={onSubmitAnswer} disabled={!selectedAnswer} className="gap-2">
              Confirmar Resposta
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={onNextScenario} className="gap-2">
              {currentScenario < scenarios.length - 1 ? (
                <>Próximo Cenário <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Ver Resultado <Trophy className="w-4 h-4" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
