import { useState } from 'react';
 import { 
  Gift, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Brain, 
  MessageSquare,
  Mail,
  Copy,
  ChevronRight,
  Star,
   Target,
   Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

export function OfferSuggestionsElite({ contactId }: Props) {
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const { data: offers, isLoading } = useQuery({
    queryKey: ['offer-suggestions-elite', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_suggestions')
        .select('*')
        .eq('contact_id', contactId)
        .order('confidence_score', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('offer_suggestions')
        .update({ status, presented_at: status === 'presented' ? new Date().toISOString() : undefined })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-suggestions-elite', contactId] });
      toast.success('Status da oferta atualizado com sucesso');
    }
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-[200px] flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary/20 animate-bounce" />
        </CardContent>
      </Card>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 flex flex-col items-center justify-center text-center">
          <Gift className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-semibold">Nenhuma oferta recomendada</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Interaja mais com o contato para que a IA gere sugestões personalizadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Sugestões de Oferta</h3>
            <p className="text-[10px] text-muted-foreground">Neuro-Match Engine v4.0</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
          <TrendingUp className="h-3 w-3" />
          LTV Predictor Active
        </Badge>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {offers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "group transition-all hover:shadow-md border-l-4",
                  offer.status === 'accepted' ? "border-l-emerald-500" :
                  offer.status === 'rejected' ? "border-l-destructive/50" :
                  "border-l-primary/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
                          {offer.offer_name}
                        </h4>
                         <div className="flex items-center gap-1.5">
                           {offer.offer_category && (
                             <Badge variant="outline" className="text-[9px] h-4">
                               {offer.offer_category}
                             </Badge>
                           )}
                           {offer.reason?.toLowerCase().includes('interesses sociais') && (
                             <Badge variant="secondary" className="text-[9px] h-4 bg-indigo-50 text-indigo-600 border-indigo-100 gap-1 px-1.5">
                               <Globe className="h-2.5 w-2.5" />
                               Social Match
                             </Badge>
                           )}
                         </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{offer.reason}"
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 mb-1">
                                <Star className={cn("h-3 w-3", (offer.confidence_score || 0) > 80 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                                <span className="text-xs font-bold">{(offer.confidence_score || 0)}%</span>
                              </div>
                              <Progress value={offer.confidence_score} className="h-1 w-16" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Confiança do Neuro-Match</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-dashed">
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5">
                            Status: <span className="font-bold uppercase">{offer.status || 'pending'}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: offer.id, status: 'presented' })}>
                            📋 Apresentada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: offer.id, status: 'accepted' })}>
                            ✅ Aceita
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: offer.id, status: 'rejected' })}>
                            ❌ Rejeitada
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`Oferta: ${offer.offer_name}\nMotivo: ${offer.reason}`);
                          toast.success('Copiado!');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 gap-2 text-xs font-bold bg-primary hover:bg-primary/90"
                        onClick={() => {
                          toast.info('Abrindo compositor de mensagem adaptativa...');
                          updateStatus.mutate({ id: offer.id, status: 'presented' });
                        }}
                      >
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        Ofertar Agora
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}