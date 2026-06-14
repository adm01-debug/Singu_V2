import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Lightbulb,
  ChevronRight,
  RefreshCcw,
  ShieldCheck
} from 'lucide-react';
import { VAK_LABELS } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { useNLPAnalysisValidation } from '@/hooks/useNLPAnalysisValidation';

interface Props {
  contactId: string;
  vakProfile: any;
  metaprogramProfile: any;
  reframings: any[];
  onRefetch?: () => void;
}

export function NLPAnalysisCard({ contactId, vakProfile, metaprogramProfile, reframings, onRefetch }: Props) {
  const { validateVAK, validateMetaprogram } = useNLPAnalysisValidation();
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null);

  const renderVAK = () => {
    if (!vakProfile) return <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma análise VAK disponível.</div>;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{VAK_LABELS[vakProfile.primary as keyof typeof VAK_LABELS]?.icon}</span>
            <div>
              <p className="text-sm font-bold">{VAK_LABELS[vakProfile.primary as keyof typeof VAK_LABELS]?.fullName}</p>
              <p className="text-[10px] text-muted-foreground">Sistema Dominante</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold">{vakProfile.confidence}%</p>
            <p className="text-[10px] text-muted-foreground">Confiança</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(vakProfile.scores).map(([key, score]: [string, any]) => {
            const label = VAK_LABELS[key[0].toUpperCase() as keyof typeof VAK_LABELS];
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>{label.name}</span>
                  <span>{Math.round(score)}%</span>
                </div>
                <Progress value={score} className={`h-1.5 ${label.color.replace('text', 'bg')}/20`} />
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" /> Dica de Comunicação
          </p>
          <p className="text-xs italic text-foreground leading-relaxed">
            "{VAK_LABELS[vakProfile.primary as keyof typeof VAK_LABELS]?.description}"
          </p>
        </div>
      </div>
    );
  };

  const renderMetaprograms = () => {
    if (!metaprogramProfile) return <div className="py-8 text-center text-muted-foreground text-sm">Nenhuma análise de metaprogramas.</div>;

    const programs = [
      { key: 'motivationDirection', value: metaprogramProfile.motivationDirection, confidence: metaprogramProfile.motivationConfidence },
      { key: 'referenceFrame', value: metaprogramProfile.referenceFrame, confidence: metaprogramProfile.referenceConfidence },
      { key: 'workingStyle', value: metaprogramProfile.workingStyle, confidence: metaprogramProfile.workingConfidence },
    ];

    return (
      <div className="space-y-4">
        {programs.map((p) => {
          const labels = (METAPROGRAM_LABELS as any)[p.key];
          const current = labels[p.value];
          
          return (
            <div key={p.key} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{p.key.replace(/([A-Z])/g, ' $1')}</p>
                <Badge variant="outline" className="text-[8px] h-4">{p.confidence}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{current.icon}</span>
                <p className="text-sm font-medium">{current.name}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                {current.description}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Análise NLP & PNL
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="vak">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="vak" className="text-[10px] uppercase">VAK</TabsTrigger>
            <TabsTrigger value="meta" className="text-[10px] uppercase">Metas</TabsTrigger>
            <TabsTrigger value="reframes" className="text-[10px] uppercase">Reframes</TabsTrigger>
          </TabsList>

          <TabsContent value="vak">
            {renderVAK()}
          </TabsContent>

          <TabsContent value="meta">
            {renderMetaprograms()}
          </TabsContent>

          <TabsContent value="reframes">
            <div className="space-y-3">
              {reframings.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">Sem reenquadramentos recentes.</div>
              ) : (
                reframings.map((r, i) => (
                  <div key={i} className="p-2 rounded border bg-card/50 text-xs">
                    <p className="font-bold text-muted-foreground mb-1">"{r.objection}"</p>
                    <p className="text-foreground italic">{r.suggested_response}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => onRefetch?.()}>
              <RefreshCcw className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold text-primary">
            Ver análise completa <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
