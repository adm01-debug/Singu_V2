import { Brain, Target, Zap, Heart, TrendingUp, Lightbulb, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Props {
  contactId: string;
  data?: {
    disc?: string;
    discConfidence?: number;
    eqScore?: number;
    eqLevel?: string;
    primaryVak?: string;
    summary?: string;
    strengths?: string[];
    riskFactors?: string[];
    approachStrategy?: string;
  };
}

export function BehavioralExecutiveSummary({ contactId, data }: Props) {
  if (!data) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-3 border-b border-primary/10">
        <CardTitle className="flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Resumo Executivo Comportamental (IA)
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            <Zap className="h-3 w-3 mr-1" />
            INTELIGÊNCIA ATIVA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Core Profile Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">DISC</p>
            <p className="text-lg font-black text-primary">{data.disc || '—'}</p>
            <p className="text-[9px] text-muted-foreground">{data.discConfidence || 0}% conf.</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Int. Emocional</p>
            <p className="text-lg font-black text-success">{data.eqScore || '—'}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{data.eqLevel || 'Moderado'}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Canal VAK</p>
            <p className="text-lg font-black text-accent">{data.primaryVak || 'Auditivo'}</p>
            <p className="text-[9px] text-muted-foreground">PREFERÊNCIA SENSORIAL</p>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
          <p className="text-xs text-foreground leading-relaxed font-medium italic">
            "{data.summary || 'Este contato apresenta um perfil voltado para resultados rápidos, mas com alta necessidade de validação técnica. Prefere comunicações diretas e objetivas via canais assíncronos.'}"
          </p>
        </div>

        {/* Strategy Section */}
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Estratégia de Abordagem Recomendada
          </h4>
          <p className="text-xs font-semibold text-foreground">
            {data.approachStrategy || 'Inicie com fatos concretos e dados (C). Use gatilhos de autoridade e evite pressões de tempo excessivas. Mantenha o tom formal e estruturado.'}
          </p>
        </div>

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-success flex items-center gap-1">
              <Star className="h-3 w-3" />
              Forças / Facilitadores
            </h4>
            <ul className="space-y-1">
              {(data.strengths || ['Decisor rápido', 'Focado em ROI', 'Aberta a inovação']).map((s, i) => (
                <li key={i} className="text-[11px] flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Riscos / Bloqueadores
            </h4>
            <ul className="space-y-1">
              {(data.riskFactors || ['Baixa tolerância a falhas', 'Sensível a preço', 'Exige conformidade']).map((r, i) => (
                <li key={i} className="text-[11px] flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-destructive" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
