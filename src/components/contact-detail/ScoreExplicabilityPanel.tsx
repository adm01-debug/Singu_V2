import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Info, MessageSquare, Heart, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

export function ScoreExplicabilityPanel({ contactId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['score-explicability', contactId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_score_explicability', { p_contact_id: contactId });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data || typeof data !== 'object') return null;

  interface FactorEntry { value: number; impact: number; days?: number }
  interface Explicability {
    current_score: number;
    factors: { volume: FactorEntry; sentiment: FactorEntry; recency: FactorEntry; risk: FactorEntry };
  }
  const explicability = data as unknown as Explicability;
  if (!explicability?.factors) return null;
  const factors = explicability.factors;
  const current_score = explicability.current_score;


  const factorConfig = [
    {
      key: 'volume',
      label: 'Volume de Interações',
      icon: MessageSquare,
      color: 'text-blue-500',
      description: `${factors.volume.value} interações registradas.`,
      impact: factors.volume.impact,
      max: 40
    },
    {
      key: 'sentiment',
      label: 'Sentimento Médio',
      icon: Heart,
      color: 'text-red-500',
      description: `Sentimento médio de ${Math.round(factors.sentiment.value)}%.`,
      impact: factors.sentiment.impact,
      max: 30
    },
    {
      key: 'recency',
      label: 'Recência do Contato',
      icon: Clock,
      color: 'text-amber-500',
      description: factors.recency.days === null ? 'Sem interações' : `${factors.recency.days} dias desde o último contato.`,
      impact: factors.recency.impact,
      max: 30
    }
  ];

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Explicabilidade do Score ({current_score}/100)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        <p className="text-xs text-muted-foreground">
          Entenda como cada fator está contribuindo para a saúde atual do seu relacionamento com este contato.
        </p>

        <div className="space-y-4">
          {factorConfig.map((factor) => (
            <div key={factor.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <factor.icon className={cn("h-3.5 w-3.5", factor.color)} />
                  <span className="font-semibold">{factor.label}</span>
                </div>
                <span className="font-medium text-foreground">
                  +{Math.round(factor.impact)} <span className="text-[10px] text-muted-foreground">/ {factor.max} pts</span>
                </span>
              </div>
              <Progress value={(factor.impact / factor.max) * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground pl-5">{factor.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 mt-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-primary mt-0.5" />
            <div className="text-[11px] leading-normal text-primary/80">
              <strong>Dica:</strong> Para aumentar o score, foque em reduzir os dias sem contato e melhorar o sentimento através de interações de alta qualidade.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
