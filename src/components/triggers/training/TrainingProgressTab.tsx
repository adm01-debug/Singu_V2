import React from 'react';
import {
  Trophy, Target, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DISCProfile, DISC_LABELS } from '@/types';
import { SalespersonProfile, TrainingScenario } from '@/data/communicationTrainingData';

interface TrainingProgressTabProps {
  score: number;
  scenarios: TrainingScenario[];
  completedScenarios: string[];
  salespersonProfile: SalespersonProfile | null;
  onResetTraining: () => void;
}

export function TrainingProgressTab({
  score,
  scenarios,
  completedScenarios,
  salespersonProfile,
  onResetTraining,
}: TrainingProgressTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <Trophy className="w-10 h-10 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">{score}</p>
            <p className="text-xs text-muted-foreground">Pontos Totais</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">
              {completedScenarios.length}/{scenarios.length}
            </p>
            <p className="text-xs text-muted-foreground">Cenários Completos</p>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Target className="w-4 h-4" />
          Domínio por Perfil
        </h4>

        {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((disc) => {
          const isCompleted = completedScenarios.includes(`scenario-${disc}`);
          const isSameAsUser = disc === salespersonProfile?.discProfile;

          return (
            <div key={disc} className="flex items-center gap-3 p-2 rounded border">
              <Badge className={cn(
                'shrink-0',
                disc === 'D' && 'bg-destructive',
                disc === 'I' && 'bg-warning',
                disc === 'S' && 'bg-success',
                disc === 'C' && 'bg-info',
              )}>
                {disc}
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium">{DISC_LABELS[disc].name}</p>
                <p className="text-xs text-muted-foreground">
                  {isSameAsUser ? 'Seu perfil' : isCompleted ? 'Cenário completo' : 'Pendente'}
                </p>
              </div>
              {isSameAsUser ? (
                <Badge variant="outline">Seu Perfil</Badge>
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted" />
              )}
            </div>
          );
        })}
      </div>

      {completedScenarios.length > 0 && (
        <Button onClick={onResetTraining} variant="outline" className="w-full gap-2">
          <RefreshCw className="w-4 h-4" />
          Reiniciar Treinamento
        </Button>
      )}
    </div>
  );
}
