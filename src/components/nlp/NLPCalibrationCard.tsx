import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { VAK_LABELS } from '@/types/vak';

interface NLPCalibrationCardProps {
  contactId: string;
  latestVAK?: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    digital: number;
    dominant: string;
    words: string[];
  };
}

export function NLPCalibrationCard({ contactId, latestVAK }: NLPCalibrationCardProps) {
  const suggestedPredicates = useMemo(() => {
    if (!latestVAK) return [];
    
    const dominant = latestVAK.dominant?.toLowerCase();
    
    if (dominant === 'visual') {
      return ['Veja', 'Visualize', 'Claramente', 'Perspectiva', 'Focar', 'Ilustrar', 'Cenário'];
    }
    if (dominant === 'auditory') {
      return ['Ouça', 'Ressoar', 'Harmonia', 'Conversar', 'Dizer', 'Mencionar', 'Sinfonia'];
    }
    if (dominant === 'kinesthetic') {
      return ['Sinta', 'Concreto', 'Pegada', 'Impacto', 'Experiência', 'Suave', 'Firme'];
    }
    return ['Analise', 'Lógico', 'Dados', 'Sentido', 'Considere', 'Processo', 'Critério'];
  }, [latestVAK]);

  if (!latestVAK) {
    return (
      <Card className="border-dashed h-full flex flex-col justify-center items-center py-10">
        <Brain className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Calibração pendente</p>
      </Card>
    );
  }

  const scores = [
    { label: 'Visual', value: latestVAK.visual, icon: Eye, color: 'text-secondary', progress: 'bg-secondary' },
    { label: 'Auditivo', value: latestVAK.auditory, icon: Ear, color: 'text-info', progress: 'bg-info' },
    { label: 'Cinestésico', value: latestVAK.kinesthetic, icon: Hand, color: 'text-success', progress: 'bg-success' },
    { label: 'Digital', value: latestVAK.digital, icon: Brain, color: 'text-muted-foreground', progress: 'bg-muted-foreground' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Calibração de Canal (VAK)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dominant Badge */}
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium">Canal Primário:</span>
          </div>
          <Badge className={VAK_LABELS[latestVAK.dominant as any]?.bgColor || 'bg-muted'}>
            {VAK_LABELS[latestVAK.dominant as any]?.name || latestVAK.dominant}
          </Badge>
        </div>

        {/* Scores */}
        <div className="space-y-3">
          {scores.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <div className="flex items-center gap-1">
                  <s.icon className={`h-3 w-3 ${s.color}`} />
                  {s.label}
                </div>
                <span>{Math.round(s.value)}%</span>
              </div>
              <Progress value={s.value} className="h-1.5" indicatorClassName={s.progress} />
            </div>
          ))}
        </div>

        {/* Suggested Predicates */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-primary" /> Predicados Adaptados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPredicates.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px] font-medium bg-primary/5 hover:bg-primary/10 border-primary/10">
                {p}
              </Badge>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-1">
            Dica: Use estas palavras para criar rapport imediato no canal preferido do cliente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
