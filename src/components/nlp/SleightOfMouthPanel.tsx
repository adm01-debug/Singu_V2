import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Quote, 
  RefreshCcw, 
  Zap, 
  Check, 
  X,
  Copy,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
 import { SLEIGHT_OF_MOUTH_PATTERNS, SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';
   const { data: interaction } = useQuery({
     queryKey: ['interaction', interactionId],
     queryFn: async () => {
       if (!interactionId) return null;
       const { data, error } = await supabase.from('interactions').select('*').eq('id', interactionId).single();
       if (error) throw error;
       return data;
     },
     enabled: !!interactionId
   });
 

interface ReframingItem {
  id: string;
  objection: string;
  objection_category: string;
  pattern_used: string;
  suggested_response: string;
  status: string;
  created_at: string;
}

interface SleightOfMouthPanelProps {
  contactId: string;
  interactionId?: string;
}

export function SleightOfMouthPanel({ contactId, interactionId }: SleightOfMouthPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reframings = [], isLoading } = useQuery({
    queryKey: ['reframing-analysis', contactId, interactionId],
    queryFn: async () => {
      let query = supabase
        .from('reframing_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (interactionId) {
        query = query.eq('interaction_id', interactionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReframingItem[];
    },
    enabled: !!user && !!contactId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('reframing_analysis')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reframing-analysis', contactId] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  if (isLoading) return <div className="h-40 animate-pulse bg-muted rounded-lg" />;

  if (reframings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum reenquadramento detectado ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            As sugestões do Sleight of Mouth aparecem após análise de interações com objeções.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Sleight of Mouth: Reenquadramentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {reframings.map((item) => {
              const pattern = SLEIGHT_OF_MOUTH_PATTERNS[item.pattern_used as any];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border bg-card p-4 space-y-3 relative group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                          {item.objection_category}
                        </Badge>
                        {pattern && (
                          <Badge className={`text-[10px] uppercase font-bold ${pattern.color}`}>
                            {pattern.icon} {pattern.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-start gap-2 mt-2">
                        <Quote className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0" />
                        <p className="text-sm font-medium italic text-muted-foreground">
                          "{item.objection}"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-success"
                        onClick={() => updateStatus.mutate({ id: item.id, status: 'used' })}
                        disabled={item.status === 'used'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => updateStatus.mutate({ id: item.id, status: 'rejected' })}
                        disabled={item.status === 'rejected'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-primary/5 dark:bg-primary/20 rounded-md p-3 border border-primary/10 relative">
                    <div className="absolute -top-2 left-3 bg-card px-1 text-[10px] font-bold text-primary flex items-center gap-1">
                      <Zap className="h-3 w-3" /> SUGESTÃO IA
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      {item.suggested_response}
                    </p>
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs gap-1.5"
                        onClick={() => copyToClipboard(item.suggested_response)}
                      >
                        <Copy className="h-3 w-3" /> Copiar Script
                      </Button>
                    </div>
                  </div>

                  {pattern && (
                    <div className="flex items-start gap-1.5 pt-1">
                      <Lightbulb className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground">
                        <strong>Dica:</strong> {pattern.description} Use para {pattern.bestFor.slice(0, 2).join(' ou ')}.
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
