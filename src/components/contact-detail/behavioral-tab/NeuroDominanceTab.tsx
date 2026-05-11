 import { Brain, Target, Zap, Waves, Sparkles, MessageSquare, ShieldCheck, Trophy } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import { Badge } from '@/components/ui/badge';
 import { motion } from 'framer-motion';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 interface NeuroDominanceTabProps {
   contactId: string;
 }
 
 export function NeuroDominanceTab({ contactId }: NeuroDominanceTabProps) {
   const { data: analysis, isLoading } = useQuery({
     queryKey: ['brain-dominance', contactId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('brain_dominance_analysis')
         .select('*')
         .eq('contact_id', contactId)
         .order('analyzed_at', { ascending: false })
         .limit(1)
         .maybeSingle();
       if (error) throw error;
       return data;
     }
   });
 
   if (isLoading) return <div className="p-8 text-center animate-pulse">Analisando dominância cerebral...</div>;
 
   const systems = [
     {
       id: 'reptilian',
       name: 'Sistema Reptiliano',
       score: analysis?.reptilian_score || 33,
       icon: Zap,
       color: 'text-orange-500',
       bg: 'bg-orange-500/10',
       description: 'Foco em sobrevivência, segurança e urgência.',
       strategy: 'Use gatilhos de escassez e garantias sólidas.'
     },
     {
       id: 'limbic',
       name: 'Sistema Límbico',
       score: analysis?.limbic_score || 33,
       icon: Waves,
       color: 'text-pink-500',
       bg: 'bg-pink-500/10',
       description: 'Foco em emoções, conexão social e pertencimento.',
       strategy: 'Foque em storytelling e prova social emocional.'
     },
     {
       id: 'neocortex',
       name: 'Neocórtex',
       score: analysis?.neocortex_score || 34,
       icon: Brain,
       color: 'text-indigo-500',
       bg: 'bg-indigo-500/10',
       description: 'Foco em lógica, dados, planos e futuro.',
       strategy: 'Apresente estatísticas, ROI e visão estratégica.'
     }
   ];
 
   const recommendations = (analysis?.recommendations as string[]) || [
     "Mantenha uma comunicação clara e direta.",
     "Reforce os benefícios lógicos da proposta.",
     "Valide as preocupações de segurança do cliente."
   ];
 
   const negotiationTips = (analysis?.negotiation_tips as string[]) || [
     "Não pressione por uma decisão emocional imediata.",
     "Forneça um roadmap detalhado dos próximos passos.",
     "Use dados comparativos para sustentar o valor."
   ];
 
   return (
     <div className="space-y-6 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {systems.map((system, idx) => (
           <motion.div
             key={system.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
           >
             <Card className={cn(
               "h-full border-2 transition-all hover:shadow-md",
               analysis?.dominant_system === system.id ? "border-primary/50 bg-primary/5" : "border-transparent"
             )}>
               <CardHeader className="pb-2">
                 <div className="flex items-center justify-between">
                   <div className={cn("p-2 rounded-lg", system.bg)}>
                     <system.icon className={cn("h-5 w-5", system.color)} />
                   </div>
                   {analysis?.dominant_system === system.id && (
                     <Badge className="bg-primary">Dominante</Badge>
                   )}
                 </div>
                 <CardTitle className="text-sm font-bold mt-2 uppercase tracking-tight">{system.name}</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-1">
                   <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                     <span>Ativação</span>
                     <span>{system.score}%</span>
                   </div>
                   <Progress value={system.score} className="h-1.5" />
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed">{system.description}</p>
                 <div className="bg-muted/50 p-2 rounded text-[10px] italic border-l-2 border-primary/30">
                   {system.strategy}
                 </div>
               </CardContent>
             </Card>
           </motion.div>
         ))}
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-primary" />
               Recomendações Personalizadas
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-3">
               {recommendations.map((rec: string, i: number) => (
                 <li key={i} className="flex items-start gap-2 text-xs">
                   <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                   </div>
                   <p className="text-muted-foreground">{rec}</p>
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
               <Trophy className="h-4 w-4 text-warning" />
               Abordagem na Negociação
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-3">
               {negotiationTips.map((tip: string, i: number) => (
                 <li key={i} className="flex items-start gap-2 text-xs">
                   <div className="h-5 w-5 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                     <Target className="h-3 w-3 text-warning" />
                   </div>
                   <p className="text-muted-foreground">{tip}</p>
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
       </div>
 
       <Card className="bg-indigo-950 text-indigo-50 border-none overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <Brain className="h-24 w-24" />
         </div>
         <CardContent className="p-6 relative z-10">
           <div className="flex items-start gap-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
               <ShieldCheck className="h-6 w-6 text-indigo-300" />
             </div>
             <div>
               <h4 className="font-bold text-lg mb-1">Engenharia de Empatia Recomendada</h4>
               <p className="text-sm text-indigo-200/80 mb-4 max-w-2xl">
                 Com base na dominância cerebral detectada, o estilo de comunicação recomendado para o próximo contato é 
                 <span className="text-white font-bold mx-1">Analítico-Consultivo</span> com ênfase em benefícios futuros.
               </p>
               <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white gap-2">
                 <MessageSquare className="h-4 w-4" />
                 Gerar Script de Rapport
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }
 
 function cn(...inputs: any[]) {
   return inputs.filter(Boolean).join(' ');
 }