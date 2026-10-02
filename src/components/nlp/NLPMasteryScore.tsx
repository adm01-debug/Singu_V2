import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export const NLPMasteryScore = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Métricas de maestria PNL
        </CardTitle>
        <CardDescription>Dados indisponíveis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Este painel será preenchido somente quando houver telemetria real e uma metodologia de cálculo validada.
        </p>
      </CardContent>
    </Card>
  );
};
