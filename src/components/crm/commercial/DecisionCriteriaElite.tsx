import { 
  Target, 
  Zap, 
  Shield, 
  TrendingUp, 
  Clock, 
  Award,
  Scale,
  BrainCircuit
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';


import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const CRITERIA_ICONS: Record<string, typeof Target> = {
  price: Scale,
  quality: Award,
  speed: Clock,
  support: Shield,
  innovation: Zap,
  security: Shield,
  roi: TrendingUp,
  default: Target
};

export function DecisionCriteriaElite({ contactId }: Props) {
  const { data: criteria, isLoading } = useQuery({
    queryKey: ['decision-criteria-elite', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decision_criteria')
        .select('*')
        .eq('contact_id', contactId)
        .order('priority', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center animate-pulse bg-muted/20 rounded-xl" />;
  }

  if (!criteria || criteria.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium">Critérios não detectados</p>
          <p className="text-xs text-muted-foreground">A análise de conversas revelará o que é vital para o fechamento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Critérios de Decisão</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Algoritmo de Priorização</p>
          </div>
        </div>
        <BrainCircuit className="h-4 w-4 text-primary/40" />
      </div>

      <div className="grid gap-3">
        {criteria.map((item, index) => {
          const Icon = CRITERIA_ICONS[item.criteria_type.toLowerCase()] || CRITERIA_ICONS.default;
          const priorityLevel = (item.priority || 1) * 10; // Assuming priority is 1-10

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:border-primary/30 transition-all cursor-default overflow-hidden">
                <CardContent className="p-4 relative">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      priorityLevel > 70 ? "bg-red-500/10 text-red-600" :
                      priorityLevel > 40 ? "bg-orange-500/10 text-orange-600" :
                      "bg-blue-500/10 text-blue-600"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold">{item.name}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4">
                          {item.criteria_type}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Relevância na Decisão</span>
                          <span className="font-bold">{priorityLevel}%</span>
                        </div>
                        <Progress 
                          value={priorityLevel} 
                          className={cn(
                            "h-1.5",
                            priorityLevel > 70 ? "[&>div]:bg-red-500" :
                            priorityLevel > 40 ? "[&>div]:bg-orange-500" :
                            "[&>div]:bg-blue-500"
                          )} 
                        />
                      </div>

                      {item.how_to_address && (
                        <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase mb-1">
                            <Zap className="h-3 w-3 fill-current" />
                            Estratégia Recomendada
                          </div>
                          <p className="text-[11px] text-foreground/80 leading-snug">
                            {item.how_to_address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}