import { memo, useState } from 'react';
import { Sparkles, MessageSquare, Phone, Mail, CheckCircle2, ChevronRight, Loader2, Copy, Zap, Coffee, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PromptChips, type PromptChip } from '@/components/ui/prompt-chips';

const TONE_CHIPS: PromptChip[] = [
  { id: 'prof', label: 'Profissional', icon: <Briefcase className="h-3 w-3 mr-1.5" /> },
  { id: 'casual', label: 'Casual', icon: <Coffee className="h-3 w-3 mr-1.5" /> },
  { id: 'urgent', label: 'Urgente', icon: <Zap className="h-3 w-3 mr-1.5" /> },
];

 
 interface Props {
   companyId: string;
   companyName: string;
 }
 
 export const QuickFollowUpGenerator = memo(({ companyId, companyName }: Props) => {
   const [generating, setGenerating] = useState(false);
   const [suggestion, setSuggestion] = useState<{
     task: string;
     script: string;
     reason: string;
     channel: 'whatsapp' | 'call' | 'email';
   } | null>(null);
 
   const handleGenerate = () => {
     setGenerating(true);
     // Simulate IA analysis based on history
     setTimeout(() => {
       setSuggestion({
         task: `Follow-up estratégico com a diretoria da ${companyName}`,
         reason: 'Última interação demonstrou interesse em expansão de licenças, mas parou no processo de aprovação interna.',
         channel: 'whatsapp',
         script: `Olá Beatriz, tudo bem? Revisitando nossos pontos da semana passada sobre o upgrade das licenças. Conseguiu alinhar com o financeiro? Caso precise de algum detalhamento extra do ROI para facilitar a aprovação, me avise! 😊`
       });
       setGenerating(false);
       toast.success('Próximo passo gerado com IA!');
     }, 1500);
   };
 
   return (
     <Card className="border-primary/20 bg-primary/5">
       <CardHeader className="pb-3 border-b border-primary/10">
         <div className="flex items-center justify-between">
           <CardTitle className="text-sm font-bold flex items-center gap-2">
             <Sparkles className="h-4 w-4 text-primary" />
             Próximos Passos & Follow-up (IA)
           </CardTitle>
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
             Estratégico
           </Badge>
         </div>
         <CardDescription className="text-[11px]">
           Insights automáticos baseados no histórico consolidado da conta.
         </CardDescription>
       </CardHeader>
       <CardContent className="pt-4">
         {!suggestion ? (
           <div className="py-4 text-center">
             <p className="text-xs text-muted-foreground mb-4">Analise o histórico recente para obter recomendações de follow-up.</p>
             <Button 
               onClick={handleGenerate} 
               disabled={generating}
               className="w-full h-9 bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-sm"
             >
               {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
               Gerar Próximo Passo IA
             </Button>
           </div>
         ) : (
           <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="p-3 rounded-lg bg-background border border-border/50 shadow-xs">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Ação Sugerida</span>
                 <Badge variant="secondary" className="text-[9px] h-4 uppercase">
                   {suggestion.channel === 'whatsapp' ? <MessageSquare className="h-3 w-3 mr-1" /> : suggestion.channel === 'call' ? <Phone className="h-3 w-3 mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                   {suggestion.channel}
                 </Badge>
               </div>
               <p className="text-sm font-bold text-foreground leading-tight">{suggestion.task}</p>
               <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic border-l-2 border-primary/20 pl-2">
                 "{suggestion.reason}"
               </p>
             </div>
 
             <div className="bg-white/60 rounded-lg border border-primary/10 p-3">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Script Recomendado</span>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-6 px-2 text-[10px] text-primary"
                   onClick={() => {
                     navigator.clipboard.writeText(suggestion.script);
                     toast.success('Script copiado!');
                   }}
                 >
                   <Copy className="h-3 w-3 mr-1" /> Copiar
                 </Button>
               </div>
               <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                 {suggestion.script}
               </p>
             </div>
 
             <div className="flex gap-2">
               <Button variant="outline" className="flex-1 h-8 text-xs font-bold" onClick={() => setSuggestion(null)}>
                 Ignorar
               </Button>
               <Button className="flex-1 h-8 text-xs font-bold gap-1.5">
                 <CheckCircle2 className="h-3.5 w-3.5" />
                 Criar Tarefa
               </Button>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 });
 QuickFollowUpGenerator.displayName = 'QuickFollowUpGenerator';