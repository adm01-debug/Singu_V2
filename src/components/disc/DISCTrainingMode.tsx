import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Trophy, Check, X, RefreshCw, ChevronRight, Star, MessageSquare, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import confetti from 'canvas-confetti';
import { TRAINING_SCENARIOS, type TrainingProgress } from './disc-training/TrainingScenarios';

interface DISCTrainingModeProps { onProgress?: (progress: TrainingProgress) => void; }

const DISCTrainingMode: React.FC<DISCTrainingModeProps> = ({ onProgress }) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState<TrainingProgress>({ scenariosCompleted: 0, correctAnswers: 0, profileMastery: { D: 0, I: 0, S: 0, C: 0 }, streak: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const currentScenario = TRAINING_SCENARIOS[currentScenarioIndex];
  const selectedOptionData = currentScenario?.options.find(o => o.id === selectedOption);
  const profileInfo = currentScenario ? DISC_PROFILES[currentScenario.profile] : null;

  const handleSelectOption = useCallback((optionId: string) => { if (!showResult) setSelectedOption(optionId); }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption || !currentScenario) return;
    setShowResult(true);
    const isCorrect = selectedOptionData?.isCorrect || false;
    setProgress(prev => {
      const newMastery = { ...prev.profileMastery };
      if (isCorrect) newMastery[currentScenario.profile] = Math.min(100, (newMastery[currentScenario.profile] || 0) + 25);
      const newProgress = { scenariosCompleted: prev.scenariosCompleted + 1, correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0), profileMastery: newMastery, streak: isCorrect ? prev.streak + 1 : 0 };
      onProgress?.(newProgress);
      return newProgress;
    });
    if (isCorrect) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  }, [selectedOption, currentScenario, selectedOptionData, onProgress]);

  const handleNextScenario = useCallback(() => {
    if (currentScenarioIndex >= TRAINING_SCENARIOS.length - 1) { setIsComplete(true); confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } }); }
    else { setCurrentScenarioIndex(prev => prev + 1); setSelectedOption(null); setShowResult(false); }
  }, [currentScenarioIndex]);

  const handleRestart = useCallback(() => { setCurrentScenarioIndex(0); setSelectedOption(null); setShowResult(false); setIsComplete(false); setProgress({ scenariosCompleted: 0, correctAnswers: 0, profileMastery: { D: 0, I: 0, S: 0, C: 0 }, streak: 0 }); }, []);

  const overallProgress = (currentScenarioIndex / TRAINING_SCENARIOS.length) * 100;
  const accuracy = progress.scenariosCompleted > 0 ? Math.round((progress.correctAnswers / progress.scenariosCompleted) * 100) : 0;

  if (isComplete) {
    return (
      <Card className="border-border/50"><CardContent className="py-12 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}><Trophy className="w-16 h-16 mx-auto mb-4 text-warning" /></motion.div>
        <h2 className="text-2xl font-bold mb-2">Treinamento Concluído! 🎉</h2>
        <p className="text-muted-foreground mb-6">Você completou todos os cenários de treinamento DISC</p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          <div className="bg-muted/50 rounded-lg p-4"><div className="text-3xl font-bold text-primary">{accuracy}%</div><div className="text-sm text-muted-foreground">Precisão</div></div>
          <div className="bg-muted/50 rounded-lg p-4"><div className="text-3xl font-bold text-success">{progress.correctAnswers}</div><div className="text-sm text-muted-foreground">Acertos</div></div>
        </div>
        <h3 className="font-medium mb-3">Domínio por Perfil</h3>
        <div className="flex justify-center gap-3 mb-8">
          {(['D', 'I', 'S', 'C'] as const).map(profile => {
            const mastery = progress.profileMastery[profile] || 0;
            const color = profile === 'D' ? 'bg-destructive' : profile === 'I' ? 'bg-warning' : profile === 'S' ? 'bg-success' : 'bg-info';
            return (<div key={profile} className="text-center"><div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-primary-foreground font-bold mb-1`}>{profile}</div><div className="text-sm font-medium">{mastery}%</div></div>);
          })}
        </div>
        <Button onClick={handleRestart} className="gap-2"><RefreshCw className="w-4 h-4" />Reiniciar Treinamento</Button>
      </CardContent></Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /><CardTitle className="text-lg">Modo Treinamento DISC</CardTitle></div>
          <div className="flex items-center gap-2">
            {progress.streak >= 3 && <Badge variant="secondary" className="gap-1"><Star className="w-3 h-3 text-warning" />{progress.streak} seguidos!</Badge>}
            <Badge variant="outline">{currentScenarioIndex + 1}/{TRAINING_SCENARIOS.length}</Badge>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ backgroundColor: profileInfo?.color?.bg || 'hsl(var(--muted))', color: profileInfo?.color?.text || 'hsl(var(--foreground))' }}>Perfil {currentScenario?.profile}</Badge>
            <span className="text-sm text-muted-foreground">{currentScenario?.situation}</span>
          </div>
          <div className="bg-background rounded-lg p-4 border">
            <MessageSquare className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-lg italic">"{currentScenario?.clientStatement}"</p>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Como você responde?</h4>
          {currentScenario?.options.map((option, idx) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = showResult && option.isCorrect;
            const showWrong = showResult && isSelected && !option.isCorrect;
            return (
              <motion.button key={option.id} onClick={() => handleSelectOption(option.id)} disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-all ${showCorrect ? 'border-success bg-success/10' : showWrong ? 'border-destructive bg-destructive/10' : isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                whileHover={!showResult ? { scale: 1.01 } : {}} whileTap={!showResult ? { scale: 0.99 } : {}}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${showCorrect ? 'bg-success text-success-foreground' : showWrong ? 'bg-destructive text-destructive-foreground' : isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {showCorrect ? <Check className="w-4 h-4" /> : showWrong ? <X className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option.text}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {showResult && selectedOptionData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-lg ${selectedOptionData.isCorrect ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOptionData.isCorrect ? 'bg-success' : 'bg-destructive'} text-primary-foreground`}>{selectedOptionData.isCorrect ? <Check /> : <X />}</div>
                <div className="flex-1">
                  <p className="font-medium mb-1">{selectedOptionData.isCorrect ? 'Excelente!' : 'Não é a melhor opção'}</p>
                  <p className="text-sm text-muted-foreground mb-3">{selectedOptionData.explanation}</p>
                  <div className="flex items-center gap-2 text-sm"><Lightbulb className="w-4 h-4 text-warning" /><span className="text-muted-foreground">{currentScenario?.learningPoint}</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-end gap-2">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedOption} className="gap-2">Confirmar Resposta<ChevronRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={handleNextScenario} className="gap-2">{currentScenarioIndex >= TRAINING_SCENARIOS.length - 1 ? 'Ver Resultados' : 'Próximo Cenário'}<ChevronRight className="w-4 h-4" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DISCTrainingMode;
