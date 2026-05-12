 import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ArrowRight, ShieldCheck, Zap, AlertTriangle, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { Skeleton } from '@/components/ui/skeleton';

interface RoadmapItem {
  month: string;
  title: string;
  probability: number;
  risk: 'low' | 'medium' | 'high';
  action: string;
  insight: string;
}

export function PredictiveRoadmap({ contactId }: { contactId: string }) {
   const { data: roadmapData, isLoading } = useQuery({
     queryKey: ['contact-predictive-roadmap', contactId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('contact_predictive_roadmap')
         .select('*')
         .eq('contact_id', contactId)
         .order('forecast_month', { ascending: true });
       
       if (error) throw error;
       return data;
     }
   });
 
   const steps: RoadmapItem[] = useMemo(() => {
     if (!roadmapData || roadmapData.length === 0) return [];
     
     return roadmapData.map((item: any) => ({
       month: format(new Date(item.forecast_month), 'MMMM yyyy', { locale: ptBR }),
       title: item.predicted_need,
       probability: item.probability,
       risk: item.probability < 50 ? 'high' : item.probability < 75 ? 'medium' : 'low',
       action: item.suggested_offering,
       insight: item.rationale
     }));
   }, [roadmapData]);
 
   if (isLoading) return <div className="space-y-4"><Skeleton className="h-[120px] w-full" /><Skeleton className="h-[120px] w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Roadmap Preditivo de 6 Meses
          </h3>
          <p className="text-xs text-muted-foreground">Projeção baseada em padrões comportamentais e ciclo de vendas médio.</p>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> IA Powered
        </Badge>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
        <div className="space-y-8">
           {steps.length > 0 ? steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="relative pl-10"
            >
              <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm z-10">
                <span className="text-[10px] font-bold">{index + 1}</span>
              </div>
              
              <Card className="hover:shadow-md transition-all border-primary/10">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <CardDescription className="text-[10px] font-bold uppercase text-primary">{step.month}</CardDescription>
                    <CardTitle className="text-sm font-bold">{step.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Probabilidade</div>
                    <div className="text-sm font-bold text-primary">{step.probability}%</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Recomendação
                      </div>
                      <p className="text-xs font-medium">{step.action}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Behavioral Insight
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight">{step.insight}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-[10px]">
                      <AlertTriangle className={`h-3 w-3 ${step.risk === 'high' ? 'text-destructive' : step.risk === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className="text-muted-foreground uppercase font-bold">Risco de Churn:</span>
                      <span className="font-bold capitalize">{step.risk}</span>
                    </div>
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-1 text-[10px] font-bold text-primary cursor-pointer"
                    >
                      Configurar Alerta <ArrowRight className="h-3 w-3" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
           )) : (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
               <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                 <Target className="h-6 w-6 text-primary/40" />
               </div>
               <p className="text-sm font-medium">Nenhum roadmap gerado ainda</p>
               <p className="text-[10px] max-w-[200px]">A IA precisa de mais interações para projetar o futuro deste contato.</p>
             </div>
           )}
        </div>
      </div>

      <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground italic flex gap-2 items-start">
        <Zap className="h-4 w-4 shrink-0 text-amber-500" />
        <span>Esta projeção é atualizada automaticamente a cada interação, recalibrando a probabilidade de sucesso com base no engajamento real detectado via NLP e análise de sentimento.</span>
      </div>
    </div>
  );
}