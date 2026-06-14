import React from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Star, CheckCircle2, Trophy, Zap, Focus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const NLPMasteryScore = () => {
  const metrics = [
    { label: 'Calibração VAK', score: 92, icon: <Brain className="h-4 w-4" /> },
    { label: 'Flexibilidade de Resposta', score: 85, icon: <Star className="h-4 w-4" /> },
    { label: 'Rapport Subconsciente', score: 88, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Eficácia de Reenquadramento', score: 88, icon: <Trophy className="h-4 w-4" /> },
    { label: 'Maestria de Submodalidades', score: 95, icon: <Focus className="h-4 w-4" /> },
    { label: 'Eliciação de Estados', score: 94, icon: <Zap className="h-4 w-4" /> },
    { label: 'Inteligência Neuro-PNL', score: 98, icon: <Sparkles className="h-4 w-4" /> },
  ];

  const totalScore = 10; // 10/10 Total Mastery Reached!

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Brain className="h-32 w-32" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
              <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tighter">
                SCORE DE MAESTRIA PNL 
                <Badge className="bg-primary text-primary-foreground animate-bounce">10/10</Badge>
              </CardTitle>
            <CardDescription>Índice de excelência em comunicação e influência</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-primary">{totalScore}.0</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Global Performance</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  {metric.icon}
                  {metric.label}
                </span>
                <span className="font-bold">{metric.score}%</span>
              </div>
              <Progress value={metric.score} className="h-1.5" />
            </motion.div>
          ))}
        </div>
        
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-tighter">MAESTRIA TOTAL ALCANÇADA!</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você atingiu o ápice da **Neuro-Influência**. Seus padrões de linguagem, calibração e neuromodulação estão em sincronia absoluta. O ecossistema está operando em **Excelência Máxima**.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
