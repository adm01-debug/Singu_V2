import { 
  Heart, 
  Quote, 
  Star, 
  Activity, 
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

export function ClientValuesElite({ contactId }: Props) {
  const { data: values, isLoading } = useQuery({
    queryKey: ['client-values-elite', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_values')
        .select('id, category, contact_id, created_at, detected_phrases, frequency, importance, last_mentioned, updated_at, user_id, value_name')
        .eq('contact_id', contactId)
        .order('importance', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center animate-pulse bg-muted/20 rounded-xl" />;
  }

  if (!values || values.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium">Valores não mapeados</p>
          <p className="text-xs text-muted-foreground">O que move este contato emocionalmente? Continue ouvindo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Arquitetura de Valores</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Mapeamento Psicográfico</p>
          </div>
        </div>
        <Activity className="h-4 w-4 text-pink-500/40 animate-pulse" />
      </div>

      <div className="flex flex-wrap gap-2">
        {values.map((v, index) => (
          <TooltipProvider key={v.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "px-3 py-1.5 cursor-default gap-1.5 transition-all hover:ring-2 hover:ring-pink-500/20",
                      (v.importance || 0) > 8 ? "bg-pink-500/10 text-pink-700 border-pink-200" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {v.value_name}
                    <span className="flex items-center gap-0.5 ml-1">
                      <Star className={cn("h-3 w-3", (v.importance || 0) > 8 ? "fill-pink-500 text-pink-500" : "text-muted-foreground")} />
                      <span className="text-[10px] font-bold">{v.importance}/10</span>
                    </span>
                  </Badge>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="p-3 max-w-[280px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{v.category}</span>
                    {v.last_mentioned && (
                      <span className="text-[10px] text-muted-foreground">
                        Última vez: {format(new Date(v.last_mentioned), "dd/MM", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  {v.detected_phrases && v.detected_phrases.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-pink-600">
                        <Quote className="h-2.5 w-2.5" /> Evidências Verbais
                      </div>
                      <p className="text-[11px] italic text-foreground/80 leading-snug">
                        "{v.detected_phrases[0]}"
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-medium">Frequência: {v.frequency || 1}x</span>
                    <Badge className="h-3 text-[8px] bg-emerald-500/10 text-emerald-600 border-0 uppercase">Confirmado</Badge>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Insights Resumo */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50/50 to-orange-50/50 border border-pink-100/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wide">Insight de Alinhamento</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">
          O contato demonstra alta prioridade em <span className="font-bold text-pink-600">{values[0]?.value_name}</span>. 
          Adapte o discurso comercial focando em como a solução reforça este valor.
        </p>
      </div>
    </div>
  );
}