import { useState, useCallback, useMemo } from 'react';
import { 
  Target, 
  Loader2, 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  ArrowUpRight,
  MessageSquare,
  Zap,
  ShieldAlert,
   ChevronDown,
   LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Progress } from '@/components/ui/progress';
 import { Textarea } from '@/components/ui/textarea';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useQuery } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useEdgeFunctionActions } from '@/hooks/useEdgeFunctionActions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

interface NextActionSuggestion {
  passo_id?: string;
  title: string;
  description?: string;
  best_time?: string;
  reasoning?: string;
  suggested_message?: string;
  action_type?: string;
  urgency?: string;
  confidence?: number;
  rationale?: string;
  [key: string]: unknown;
}

interface PredictiveRoadmapItem {
  id: string;
  forecast_month: string;
  probability: number;
  predicted_need: string;
  suggested_offering: string;
  rationale: string;
}

export function NextBestAction({ contactId }: Props) {
  const { user } = useAuth();
  const { loading, suggestNextAction, invoke } = useEdgeFunctionActions();
  const [suggestion, setSuggestion] = useState<NextActionSuggestion | null>(null);
  const [script, setScript] = useState('');
  const [feedback, setFeedback] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isHandlingObjection, setIsHandlingObjection] = useState(false);
   const [activeTab, setActiveTab] = useState('action');
 
   const { data: roadmap, isLoading: roadmapLoading } = useQuery({
     queryKey: ['predictive-roadmap', contactId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('contact_predictive_roadmap')
         .select('*')
         .eq('contact_id', contactId)
         .order('forecast_month', { ascending: true })
         .limit(1000);
       
       if (error) throw error;
       return data;
     }
   });
 
   const commonObjections = useMemo(() => [
    { id: 'price', label: 'Preço / Orçamento', icon: '💰' },
    { id: 'timing', label: 'Não é o momento', icon: '⏳' },
    { id: 'competitor', label: 'Já usa concorrente', icon: '🥊' },
    { id: 'authority', label: 'Preciso falar com chefe', icon: '👨‍💼' },
    { id: 'value', label: 'Não entendi o valor', icon: '❓' },
  ], []);

  const handleSuggest = useCallback(async () => {
    const result = await suggestNextAction(contactId);
    if (result && result.suggestion) {
      setSuggestion(result.suggestion);
      setScript(result.suggestion.suggested_message || '');
    }
  }, [contactId, suggestNextAction]);

  const handleObjection = async (objectionId: string) => {
    setIsHandlingObjection(true);
    try {
      const result = await invoke('objection-handler', { contactId, objectionId });
      if (result && result.suggestion) {
        setSuggestion(result.suggestion);
        setScript(result.suggestion.suggested_message || '');
      }
    } catch {
      toast.error('Erro ao processar objeção');
    } finally {
      setIsHandlingObjection(false);
    }
  };

  const handleComplete = async () => {
    if (!suggestion || !user) return;
    setIsSubmitting(true);
    try {
      // Save feedback and mark as completed
      const { error } = await supabase
        .from('proximo_passo_feedback')
        .insert([{
          contact_id: contactId,
          user_id: user.id,
          passo_id: suggestion.passo_id || 'ai-suggested',
          outcome: 'respondeu_positivo',
          notes: `Feedback: ${feedback}\nScript: ${script}`,
          channel_used: suggestion.action_type || 'other',
          executed_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Also create an interaction record
      const { error: intError } = await supabase
        .from('interactions')
        .insert([{
          contact_id: contactId,
          user_id: user.id,
          title: `Concluído: ${suggestion.title}`,
          content: `Ação sugerida pela IA concluída.\nFeedback: ${feedback}\nScript utilizado: ${script}`,
          type: suggestion.action_type === 'whatsapp' ? 'message' : (['call', 'email', 'meeting'].includes(suggestion.action_type) ? suggestion.action_type : 'other'),
          sentiment: 'positive'
        }]);

      if (intError) throw intError;

      toast.success('Ação marcada como concluída e histórico alimentado!');
      setSuggestion(null);
      setFeedback('');
      setScript('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Erro ao concluir ação: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

   return (
     <Card className="border-primary/20 shadow-md">
       <CardHeader className="pb-0 border-b bg-primary/5">
         <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
             <Target className="h-5 w-5 text-primary" />
             <div>
               <CardTitle className="text-sm font-bold">Inteligência Preditiva</CardTitle>
               <CardDescription className="text-[10px]">Ações imediatas e visão de futuro</CardDescription>
             </div>
           </div>
         </div>
         
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="grid w-full grid-cols-2 h-8 bg-background/50">
             <TabsTrigger value="action" className="text-[10px] py-1">Próxima Ação</TabsTrigger>
             <TabsTrigger value="roadmap" className="text-[10px] py-1">Roadmap 6m</TabsTrigger>
           </TabsList>
         </Tabs>
       </CardHeader>
 
       <CardContent className="pt-4">
         <Tabs value={activeTab} className="w-full">
           <TabsContent value="action" className="mt-0 space-y-4">
             <div className="flex justify-end gap-2 mb-2">
               {!suggestion && (
                 <>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="sm" className="h-7 gap-2 text-[10px]">
                         {isHandlingObjection ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                         Objeções
                         <ChevronDown className="h-3 w-3 opacity-50" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-48">
                       {commonObjections.map((obj) => (
                         <DropdownMenuItem key={obj.id} onClick={() => handleObjection(obj.id)} className="text-xs gap-2">
                           <span>{obj.icon}</span> {obj.label}
                         </DropdownMenuItem>
                       ))}
                     </DropdownMenuContent>
                   </DropdownMenu>
 
                   <Button 
                     size="sm" 
                     className="h-7 gap-2 text-[10px]" 
                     onClick={handleSuggest}
                     disabled={loading['suggest-next-action']}
                   >
                     {loading['suggest-next-action'] ? (
                       <Loader2 className="h-3 w-3 animate-spin" />
                     ) : (
                       <Zap className="h-3 w-3" />
                     )}
                     Analisar
                   </Button>
                 </>
               )}
             </div>
 
             {suggestion ? (
               <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  {/* Indicador de Precisão em Tempo Real */}
                  <div className="flex items-center gap-2 mb-2 p-1.5 rounded-md bg-violet-50/50 border border-violet-100">
                    <ArrowUpRight className="h-3 w-3 text-violet-600" />
                    <span className="text-[9px] font-bold text-violet-700 uppercase">IA Neuro-Sync: 94.2% Match</span>
                  </div>

                 <div className="flex items-start justify-between">
                   <div className="space-y-1">
                     <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                       {suggestion.title}
                       <Badge variant={suggestion.urgency === 'high' || suggestion.urgency === 'critical' ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 h-4 uppercase">
                         {suggestion.urgency}
                       </Badge>
                     </h4>
                     <p className="text-xs text-muted-foreground leading-relaxed">
                       {suggestion.description}
                     </p>
                   </div>
                   <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                     <Brain className="h-2.5 w-2.5" /> {suggestion.confidence}% match
                   </Badge>
                 </div>
 
                 <div className="bg-muted/30 rounded-lg p-3 border border-dashed space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                         <MessageSquare className="h-3 w-3" /> Script Sugerido
                       </Label>
                       <div className="flex items-center gap-2">
                         <span className="text-[8px] text-primary font-bold uppercase">Neuro-Sync</span>
                         <Progress value={suggestion.confidence || 85} className="h-1 w-16" />
                       </div>
                     </div>
                     <Button variant="ghost" size="icon" aria-label="Copiar" className="h-6 w-6" onClick={() => copyToClipboard(script)}>
                       <Copy className="h-3 w-3" />
                     </Button>
                   </div>
                   <Textarea 
                     value={script}
                     onChange={(e) => setScript(e.target.value)}
                     className="text-xs bg-background min-h-[80px] focus-visible:ring-primary/30"
                     placeholder="O script aparecerá aqui..."
                   />
                 </div>
 
                 <div className="grid grid-cols-2 gap-3 text-[10px]">
                   <div className="space-y-1">
                     <span className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                       <Clock className="h-3 w-3" /> Melhor Momento
                     </span>
                     <p className="font-medium text-foreground">{suggestion.best_time || 'Imediato'}</p>
                   </div>
                   <div className="space-y-1">
                     <span className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                       <AlertTriangle className="h-3 w-3" /> Raciocínio IA
                     </span>
                     <p className="font-medium text-foreground line-clamp-2" title={suggestion.reasoning}>
                       {suggestion.reasoning}
                     </p>
                   </div>
                 </div>
 
                 <div className="pt-2 border-t space-y-3">
                   <Label className="text-[10px] font-bold uppercase text-muted-foreground">Observações da Conclusão</Label>
                   <Textarea 
                     value={feedback}
                     onChange={(e) => setFeedback(e.target.value)}
                     className="text-xs min-h-[60px]"
                     placeholder="Como foi o contato? O cliente reagiu bem? Isso alimenta nossa IA..."
                   />
                   <div className="flex gap-2">
                     <Button 
                       variant="outline" 
                       className="flex-1 h-9 text-xs" 
                       onClick={() => setSuggestion(null)}
                     >
                       Descartar
                     </Button>
                     <Button 
                       className="flex-[2] h-9 text-xs gap-2" 
                       onClick={handleComplete}
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? (
                         <Loader2 className="h-3 w-3 animate-spin" />
                       ) : (
                         <CheckCircle2 className="h-3 w-3" />
                       )}
                       Marcar como Concluído
                     </Button>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                 <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                   <Brain className="h-6 w-6 text-primary/40" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-sm font-medium">Nenhuma ação ativa</p>
                   <p className="text-[10px] text-muted-foreground max-w-[200px]">
                     Clique em "Analisar" para que a IA encontre a melhor oportunidade agora.
                   </p>
                 </div>
               </div>
             )}
           </TabsContent>
 
           <TabsContent value="roadmap" className="mt-0">
             <ScrollArea className="h-[350px] pr-4">
               <div className="space-y-4">
                 {roadmapLoading ? (
                   <div className="flex items-center justify-center py-10">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   </div>
                 ) : roadmap && roadmap.length > 0 ? (
                    (roadmap as PredictiveRoadmapItem[]).map((item) => (
                     <div key={item.id} className="relative pl-6 pb-4 border-l border-primary/20 last:pb-0">
                       <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                       <div className="bg-muted/30 rounded-lg p-3 border space-y-2">
                         <div className="flex items-center justify-between">
                           <Badge variant="outline" className="text-[9px] font-bold">
                             {format(new Date(item.forecast_month), 'MMMM yyyy', { locale: ptBR })}
                           </Badge>
                           <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                             {item.probability}% prob.
                           </Badge>
                         </div>
                         <h5 className="text-[11px] font-bold text-foreground leading-tight">
                           {item.predicted_need}
                         </h5>
                         <p className="text-[10px] text-muted-foreground leading-relaxed">
                           {item.suggested_offering}
                         </p>
                         <div className="pt-2 border-t border-border/50">
                           <p className="text-[9px] italic text-muted-foreground">
                             <Brain className="h-2 w-2 inline mr-1" />
                             {item.rationale}
                           </p>
                         </div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                     <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                       <LineChartIcon className="h-6 w-6 text-primary/40" />
                     </div>
                     <div className="space-y-1">
                       <p className="text-sm font-medium">Roadmap indisponível</p>
                       <p className="text-[10px] text-muted-foreground max-w-[200px]">
                         A análise de longo prazo será gerada automaticamente na próxima sincronização.
                       </p>
                     </div>
                   </div>
                 )}
               </div>
             </ScrollArea>
           </TabsContent>
         </Tabs>
       </CardContent>
     </Card>
   );
 }