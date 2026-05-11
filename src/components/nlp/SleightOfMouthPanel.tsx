import React, { useState } from 'react';
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
  Lightbulb,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SLEIGHT_OF_MOUTH_PATTERNS, SLEIGHT_TEMPLATES } from '@/data/sleightOfMouth';
import { useNLPAnalysisValidation } from "@/hooks/useNLPAnalysisValidation";
import { ThumbsUp, ThumbsDown } from "lucide-react";

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
  const { addReframingFeedback } = useNLPAnalysisValidation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'detected' | 'templates'>('detected');

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

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardHeader className="pb-3 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-primary" />
            Sleight of Mouth: Reenquadramentos
          </CardTitle>
          <div className="flex bg-muted p-1 rounded-md">
            <Button 
              variant={activeTab === 'detected' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 text-[10px] uppercase font-bold"
              onClick={() => setActiveTab('detected')}
            >
              Detectados
            </Button>
            <Button 
              variant={activeTab === 'templates' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-7 text-[10px] uppercase font-bold"
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activeTab === 'detected' ? (
              reframings.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma objeção processada ainda.</p>
                </div>
              ) : (
                reframings.map((item) => {
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
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-muted/50 rounded-full px-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full text-muted-foreground hover:text-success"
                              onClick={() => addReframingFeedback(item.id, "positive")}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => addReframingFeedback(item.id, "negative")}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-success"
                            onClick={() => updateStatus.mutate({ id: item.id, status: "used" })}
                            disabled={item.status === "used"}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-primary/5 dark:bg-primary/20 rounded-md p-3 border border-primary/10 relative">
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
                    </motion.div>
                  );
                })
              )
            ) : (
              <div className="space-y-3">
                {SLEIGHT_TEMPLATES.slice(0, 10).map((tpl) => {
                  const pattern = SLEIGHT_OF_MOUTH_PATTERNS[tpl.pattern as any];
                  return (
                    <div key={tpl.id} className="p-3 border rounded-lg bg-card hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase">{tpl.objectionCategory}</Badge>
                        {pattern && <span className="text-xs">{pattern.icon} {pattern.name}</span>}
                      </div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">"{tpl.objection}"</p>
                      <p className="text-xs text-foreground bg-muted/50 p-2 rounded italic">
                        {tpl.response.replace(/{nome}/g, 'Fulano')}
                      </p>
                      <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => copyToClipboard(tpl.response)}>
                          <Copy className="h-3 w-3 mr-1" /> Copiar Template
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
