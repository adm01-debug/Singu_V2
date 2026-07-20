import { useEffect } from 'react';
import { 
  Gift, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Copy, 
  Star,
   RefreshCw,
   Clock,
   Settings,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useSocialSync } from '@/hooks/commercial/useSocialSync';
import { SocialMatchPanel } from './components/SocialMatchPanel';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

export function OfferSuggestionsElite({ contactId }: Props) {
  const queryClient = useQueryClient();
  const { queueStatus, auditLogs, syncNow } = useSocialSync(contactId);

  const { data: offers, isLoading } = useQuery({
    queryKey: ['offer-suggestions-elite', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_suggestions')
        .select('*')
        .eq('contact_id', contactId)
        .order('confidence_score', { ascending: false })
        .limit(1000);
      
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
      toast.success('Status da oferta atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status da oferta'),
  });

  useEffect(() => {
    const lastSync = queueStatus?.created_at;
    if (!lastSync || new Date(lastSync).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      // Auto-sync logic could be triggered here
    }
  }, [queueStatus]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-[200px] flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary/20 animate-bounce" />
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
         <div className="flex items-center gap-2">
           <div className="hidden sm:flex items-center gap-1.5 mr-2">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 cursor-help">
                     <Settings className="h-3 w-3 text-slate-500" />
                     <span className="text-[10px] font-bold text-slate-600 uppercase">Auto-Pilot</span>
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   </div>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p className="text-[10px]">Rotina agendada ativa: Sincronização automática a cada 24h.</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           </div>
           <AuditLogDrawer logs={auditLogs || []} />
           <Button 
             variant="outline" 
             size="sm" 
            className={cn(
              "h-8 gap-2 text-[10px] font-bold uppercase tracking-wider",
              queueStatus?.status === 'pending' || queueStatus?.status === 'processing' ? "animate-pulse border-amber-500/50 text-amber-600" : ""
            )}
            onClick={() => syncNow.mutate()}
            disabled={syncNow.isPending || queueStatus?.status === 'processing'}
          >
            <RefreshCw className={cn("h-3 w-3", syncNow.isPending || queueStatus?.status === 'processing' ? "animate-spin" : "")} />
            {queueStatus?.status === 'processing' ? 'Sincronizando...' : 'Sync Social'}
          </Button>
          <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
            <TrendingUp className="h-3 w-3" />
            LTV Predictor
          </Badge>
        </div>
      </div>

      {queueStatus && queueStatus.status === 'failed' && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-destructive font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Falha na última sincronização social
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] hover:bg-destructive/10 text-destructive"
            onClick={() => syncNow.mutate()}
          >
            Tentar Novamente ({queueStatus.retry_count}/{queueStatus.max_retries})
          </Button>
        </div>
      )}

      {queueStatus && queueStatus.status === 'processing' && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-2 text-[10px] text-amber-700 font-medium">
          <Clock className="h-3 w-3 animate-spin" />
          Recalculando sugestões com base em novos interesses sociais...
        </div>
      )}

      <div className="grid gap-3">
        <AnimatePresence>
          {offers?.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "group transition-all hover:shadow-md border-l-4",
                offer.status === 'accepted' ? "border-l-emerald-500" :
                offer.status === 'rejected' ? "border-l-destructive/50" :
                "border-l-primary/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
                          {offer.offer_name}
                        </h4>
                        {offer.offer_category && (
                          <Badge variant="outline" className="text-[9px] h-4">
                            {offer.offer_category}
                          </Badge>
                        )}
                        {offer.reason?.toLowerCase().includes('social') && (
                          <Badge variant="secondary" className="text-[9px] h-4 bg-indigo-50 text-indigo-600 border-indigo-100 gap-1 px-1.5">
                            <Globe className="h-2.5 w-2.5" />
                            Social Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{offer.reason}"
                      </p>
                      <SocialMatchPanel
                        contactId={contactId}
                        offerName={offer.offer_name}
                        metadata={(offer.metadata as { sources?: string[]; keywords?: string[]; social_insight_ids?: string[] } | null) ?? {}}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className={cn("h-3 w-3", (offer.confidence_score || 0) > 80 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                          <span className="text-xs font-bold">{(offer.confidence_score || 0)}%</span>
                        </div>
                        <Progress value={offer.confidence_score} className="h-1 w-16" />
                      </div>
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
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => {
                        navigator.clipboard.writeText(`Oferta: ${offer.offer_name}\nMotivo: ${offer.reason}`);
                        toast.success('Copiado!');
                      }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" className="h-8 gap-2 text-xs font-bold bg-primary hover:bg-primary/90" onClick={() => updateStatus.mutate({ id: offer.id, status: 'presented' })}>
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
