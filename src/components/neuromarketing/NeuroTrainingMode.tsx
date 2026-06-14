// ==============================================
// NEURO TRAINING MODE - Interactive Brain System Training
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, Brain, Play, RotateCcw, CheckCircle2,
  XCircle, Trophy, Lightbulb, ArrowRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainSystem } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';
import { TRAINING_QUESTIONS } from '@/data/neuroTrainingQuestions';

interface NeuroTrainingModeProps {
  className?: string;
  onComplete?: (score: number, total: number) => void;
}

const NeuroTrainingMode = ({ className, onComplete }: NeuroTrainingModeProps) => {
  const [isTraining, setIsTraining] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showLearning, setShowLearning] = useState(false);

  const currentQuestion = TRAINING_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / TRAINING_QUESTIONS.length) * 100;
  const isComplete = currentQuestionIndex >= TRAINING_QUESTIONS.length;

  const handleStartTraining = () => {
    setIsTraining(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowLearning(false);
  };

  const handleSelectAnswer = (answerId: string) => {
    if (showResult) return;
    setSelectedAnswer(answerId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer) return;
    if (currentQuestion.options.find(o => o.id === selectedAnswer)?.isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (showLearning) {
      setShowLearning(false);
      setShowResult(false);
      setSelectedAnswer(null);
      if (currentQuestionIndex + 1 < TRAINING_QUESTIONS.length) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        onComplete?.(score, TRAINING_QUESTIONS.length);
      }
    } else {
      setShowLearning(true);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'identify_brain': return 'Identifique o Cérebro';
      case 'match_stimulus': return 'Identifique o Estímulo';
      case 'choose_approach': return 'Escolha a Abordagem';
      default: return 'Questão';
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / TRAINING_QUESTIONS.length) * 100;
    if (percentage >= 90) return { message: 'Excelente! Você é um expert em neurovendas!', color: 'text-success' };
    if (percentage >= 70) return { message: 'Muito bom! Continue praticando para dominar.', color: 'text-info' };
    if (percentage >= 50) return { message: 'Bom começo! Revise os conceitos e tente novamente.', color: 'text-warning' };
    return { message: 'Continue estudando! A prática leva à perfeição.', color: 'text-accent' };
  };

  if (!isTraining) return <TrainingIntro className={className} onStart={handleStartTraining} />;

  if (isComplete || (currentQuestionIndex + 1 > TRAINING_QUESTIONS.length && !showResult)) {
    return <TrainingComplete className={className} score={score} total={TRAINING_QUESTIONS.length} scoreMessage={getScoreMessage()} onRestart={handleStartTraining} />;
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-base">Neuro Training</CardTitle>
              <p className="text-xs text-muted-foreground">Questão {currentQuestionIndex + 1} de {TRAINING_QUESTIONS.length}</p>
            </div>
          </div>
          <Badge variant="outline">{score} pontos</Badge>
        </div>
        <Progress value={progress} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!showLearning ? (
            <motion.div key="question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <Badge variant="secondary" className="gap-1"><Brain className="h-3 w-3" />{getQuestionTypeLabel(currentQuestion.type)}</Badge>
              <div className="p-4 rounded-lg bg-accent/50"><p className="text-sm">{currentQuestion.scenario}</p></div>
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      onClick={() => handleSelectAnswer(option.id)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        isSelected && !showResult && "border-primary bg-primary/5",
                        showResult && option.isCorrect && "border-success bg-success/10",
                        showResult && isSelected && !option.isCorrect && "border-destructive bg-destructive/10",
                        !isSelected && !showResult && "hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{option.label}</span>
                        {showResult && option.isCorrect && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {showResult && isSelected && !option.isCorrect && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      {showResult && (isSelected || option.isCorrect) && <p className="text-xs text-muted-foreground mt-2">{option.explanation}</p>}
                    </motion.button>
                  );
                })}
              </div>
              {!showResult && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 text-warning dark:text-warning">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" /><p className="text-xs">{currentQuestion.hint}</p>
                </div>
              )}
              <div className="flex gap-2">
                {!showResult ? (
                  <Button onClick={handleConfirmAnswer} disabled={!selectedAnswer} className="w-full">Confirmar Resposta</Button>
                ) : (
                  <Button onClick={handleNextQuestion} className="w-full gap-2">Ver Aprendizado<ArrowRight className="h-4 w-4" /></Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="learning" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="h-5 w-5 text-primary" /><h4 className="font-semibold">Ponto de Aprendizado</h4></div>
                <p className="text-sm">{currentQuestion.learningPoint}</p>
              </div>
              <Button onClick={handleNextQuestion} className="w-full gap-2">
                {currentQuestionIndex + 1 < TRAINING_QUESTIONS.length ? (<>Próxima Questão<ArrowRight className="h-4 w-4" /></>) : (<>Ver Resultado Final<Trophy className="h-4 w-4" /></>)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

function TrainingIntro({ className, onStart }: { className?: string; onStart: () => void }) {
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div>
          <div>
            <CardTitle className="text-lg">Neuro Training Mode</CardTitle>
            <p className="text-xs text-muted-foreground">Aprenda a identificar e responder a cada sistema cerebral</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {(['reptilian', 'limbic', 'neocortex'] as BrainSystem[]).map(brain => {
            const info = BRAIN_SYSTEM_INFO[brain];
            return (
              <motion.div key={brain} whileHover={{ scale: 1.02 }} className="p-3 rounded-lg border text-center" style={{ borderColor: `${info.color}40` }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg" style={{ backgroundColor: `${info.color}20` }}>{info.icon}</div>
                <p className="text-sm font-medium">{info.namePt}</p>
                <p className="text-xs text-muted-foreground">{info.mainFunction}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="p-4 rounded-lg bg-accent/50 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" />O que você vai aprender:</div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Identificar qual sistema cerebral está dominando</li>
            <li>Reconhecer os 6 estímulos primais em ação</li>
            <li>Escolher a abordagem certa para cada perfil</li>
            <li>Aplicar neurovendas na prática</li>
          </ul>
        </div>
        <Button onClick={onStart} className="w-full gap-2"><Play className="h-4 w-4" />Iniciar Treinamento ({TRAINING_QUESTIONS.length} questões)</Button>
      </CardContent>
    </Card>
  );
}

function TrainingComplete({ className, score, total, scoreMessage, onRestart }: { className?: string; score: number; total: number; scoreMessage: { message: string; color: string }; onRestart: () => void }) {
  const percentage = (score / total) * 100;
  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="pt-6 space-y-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10"><Trophy className="h-12 w-12 text-primary" /></div>
        </motion.div>
        <div className="text-center">
          <h3 className="text-xl font-bold">Treinamento Completo!</h3>
          <p className={cn("text-sm mt-1", scoreMessage.color)}>{scoreMessage.message}</p>
        </div>
        <div className="p-4 rounded-lg bg-accent/50 text-center">
          <p className="text-4xl font-bold text-primary">{score}/{total}</p>
          <p className="text-sm text-muted-foreground">{percentage.toFixed(0)}% de acerto</p>
          <Progress value={percentage} className="mt-2" />
        </div>
        <Button onClick={onRestart} className="w-full gap-2"><RotateCcw className="h-4 w-4" />Treinar Novamente</Button>
      </CardContent>
    </Card>
  );
}

export default NeuroTrainingMode;
