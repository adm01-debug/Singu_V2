import { motion } from 'framer-motion';
import { Target, TrendingUp, BarChart3, AlertCircle, Info, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  companyId: string;
  data?: {
    healthScore?: number;
    healthLevel?: string;
    rfmSegment?: string;
    leadScore?: number;
    leadStatus?: string;
    summary?: string;
    strengths?: string[];
    riskFactors?: string[];
    growthPropensity?: number;
  };
}

export function CompanyExecutiveSummary({ companyId, data }: Props) {
  if (!data) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-3 border-b border-primary/10">
        <CardTitle className="flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Resumo Estratégico da Conta (IA)
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            <Zap className="h-3 w-3 mr-1" />
            INTELIGÊNCIA CORPORATIVA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Core Profile Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Health Score</p>
            <p className="text-lg font-black text-primary">{data.healthScore || '—'}</p>
            <p className={cn("text-[9px] uppercase font-bold", 
              data.healthLevel === 'Excellent' || data.healthLevel === 'Good' ? 'text-success' : 'text-warning'
            )}>
              {data.healthLevel || 'Normal'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Segmento RFM</p>
            <p className="text-sm font-black text-success leading-tight pt-1">{data.rfmSegment || 'Prospect'}</p>
            <p className="text-[9px] text-muted-foreground uppercase">MATRIZ DE VALOR</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/50 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Propensão de Expansão</p>
            <p className="text-lg font-black text-accent">{data.growthPropensity || 65}%</p>
            <p className="text-[9px] text-muted-foreground">SCORE DE CRESCIMENTO</p>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
          <p className="text-xs text-foreground leading-relaxed font-medium italic">
            "{data.summary || 'Empresa com forte presença no segmento cooperativista, demonstrando estabilidade financeira e alto engajamento nas últimas interações. Potencial identificado para cross-sell de novos módulos de gestão.'}"
          </p>
        </div>

        {/* Lead Context */}
        {(data.leadScore || data.leadStatus) && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Status de Qualificação Comercial
            </h4>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Qualificação: {data.leadStatus || 'Qualificado'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold">{data.leadScore || 0}%</span>
                <Progress value={data.leadScore || 0} className="h-1.5 w-20" />
              </div>
            </div>
          </div>
        )}

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Drivers de Oportunidade
            </h4>
            <ul className="space-y-1">
              {(data.strengths || ['Decisor engajado', 'Orçamento aprovado', 'Fidelidade histórica']).map((s, i) => (
                <li key={i} className="text-[11px] flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-success" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Fatores de Risco
            </h4>
            <ul className="space-y-1">
              {(data.riskFactors || ['Aumento de churn no setor', 'Mudança na diretoria', 'Concorrência agressiva']).map((r, i) => (
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
