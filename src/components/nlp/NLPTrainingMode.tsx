import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Eye, Target, CheckCircle, XCircle, RefreshCw, Lightbulb, Zap, Trophy, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VAK_LABELS, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { toast } from 'sonner';
import { TRAINING_SCENARIOS } from '@/data/nlpTrainingScenarios';

type TrainingType = 'vak_detection' | 'vak_adaptation' | 'meta_detection' | 'meta_adaptation' | 'combined';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const NLPTrainingMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrainingType>('vak_detection');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [practiceText, setPracticeText] = useState('');

  const filteredScenarios = useMemo(() =>
    TRAINING_SCENARIOS.filter(s =>
      (activeTab === 'combined' || s.type === activeTab) &&
      (difficulty === 'advanced' || s.difficulty === difficulty || s.difficulty === 'beginner')
    ), [activeTab, difficulty]);

  const currentScenario = filteredScenarios[currentScenarioIndex % filteredScenarios.length];

  const handleAnswer = () => {
    if (!selectedAnswer || !currentScenario) return;
    setShowResult(true);
    const isCorrect = currentScenario.options.find(o => o.id === selectedAnswer)?.isCorrect;
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
    if (isCorrect) toast.success('Correto! 🎉', { duration: 2000 });
    else toast.error('Não foi dessa vez', { duration: 2000 });
  };

  const nextScenario = () => { setCurrentScenarioIndex(prev => prev + 1); setSelectedAnswer(null); setShowResult(false); };
  const resetTraining = () => { setCurrentScenarioIndex(0); setSelectedAnswer(null); setShowResult(false); setScore({ correct: 0, total: 0 }); };

  const selectedOption = currentScenario?.options.find(o => o.id === selectedAnswer);
  const progressPercent = score.total > 0 ? (score.correct / score.total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><GraduationCap className="w-5 h-5 text-primary" />Modo Treinamento PNL</CardTitle>
            <CardDescription>Aprenda a identificar e adaptar comunicação por perfil</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><Trophy className="w-3 h-3" />{score.correct}/{score.total}</Badge>
            <Button variant="outline" size="sm" onClick={resetTraining}><RefreshCw className="w-3.5 h-3.5 mr-1" />Reiniciar</Button>
          </div>
        </div>
        {score.total > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TrainingType); resetTraining(); }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vak_detection" className="gap-1"><Eye className="w-3 h-3" />VAK</TabsTrigger>
            <TabsTrigger value="meta_detection" className="gap-1"><Target className="w-3 h-3" />Metaprogramas</TabsTrigger>
            <TabsTrigger value="combined" className="gap-1"><Zap className="w-3 h-3" />Combinado</TabsTrigger>
            <TabsTrigger value="vak_adaptation" className="gap-1"><BookOpen className="w-3 h-3" />Prática</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {activeTab !== 'vak_adaptation' && currentScenario ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Dificuldade:</span>
                  {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => (
                    <Button key={d} size="sm" variant={difficulty === d ? 'default' : 'outline'} onClick={() => { setDifficulty(d); resetTraining(); }}>
                      {d === 'beginner' ? 'Iniciante' : d === 'intermediate' ? 'Intermediário' : 'Avançado'}
                    </Button>
                  ))}
                </div>

                <motion.div key={currentScenario.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-lg border bg-muted/30">
                  <Badge className="mb-2">{currentScenario.title}</Badge>
                  <p className="text-sm text-muted-foreground mb-3">{currentScenario.context}</p>
                  <div className="p-4 rounded-lg bg-card border-l-4 border-primary mb-4">
                    <p className="italic text-foreground">{currentScenario.clientStatement}</p>
                  </div>
                  <p className="text-sm font-medium mb-3">Qual é o perfil dominante?</p>
                  <RadioGroup value={selectedAnswer || ''} onValueChange={setSelectedAnswer} disabled={showResult} className="space-y-2">
                    {currentScenario.options.map(option => (
                      <div key={option.id} className={cn('flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                        showResult && option.isCorrect && 'bg-success border-success dark:bg-success',
                        showResult && !option.isCorrect && selectedAnswer === option.id && 'bg-destructive border-destructive dark:bg-destructive',
                        !showResult && selectedAnswer === option.id && 'bg-primary/10 border-primary')}>
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">{option.label}</Label>
                        {showResult && (option.isCorrect ? <CheckCircle className="w-5 h-5 text-success" /> : selectedAnswer === option.id && <XCircle className="w-5 h-5 text-destructive" />)}
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>

                <AnimatePresence>
                  {showResult && selectedOption && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className={cn('p-4 rounded-lg', selectedOption.isCorrect ? 'bg-success dark:bg-success' : 'bg-warning dark:bg-warning')}>
                        <p className="text-sm">{selectedOption.explanation}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10">
                        <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Dica de Comunicação</span></div>
                        <p className="text-sm text-muted-foreground">{currentScenario.learningPoint}</p>
                      </div>
                      {currentScenario.adaptedResponse && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm font-medium mb-1">Exemplo de resposta adaptada:</p>
                          <p className="text-sm italic text-muted-foreground">{currentScenario.adaptedResponse}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between">
                  {!showResult ? (
                    <Button onClick={handleAnswer} disabled={!selectedAnswer}>Verificar Resposta</Button>
                  ) : (
                    <Button onClick={nextScenario}>Próximo Cenário →</Button>
                  )}
                </div>
              </div>
            ) : activeTab === 'vak_adaptation' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm font-medium mb-2">Pratique a adaptação VAK</p>
                  <p className="text-sm text-muted-foreground mb-4">Reescreva a frase abaixo usando cada sistema representacional:</p>
                  <div className="p-3 rounded bg-card border-l-4 border-primary mb-4">
                    <p className="italic">"Nossa solução vai ajudar sua empresa a crescer e ter melhores resultados."</p>
                  </div>
                  <Textarea value={practiceText} onChange={(e) => setPracticeText(e.target.value)} placeholder="Reescreva usando predicados visuais, auditivos ou cinestésicos..." rows={4} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['V', 'A', 'K'] as const).map(vak => (
                    <div key={vak} className="p-3 rounded-lg border">
                      <Badge className="mb-2">{VAK_LABELS[vak].icon} {VAK_LABELS[vak].name}</Badge>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {VAK_COMMUNICATION_TIPS[vak].salesTips.slice(0, 3).map((tip, i) => <li key={i}>• {tip}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NLPTrainingMode;
