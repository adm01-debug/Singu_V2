import { memo, useState } from 'react';
import { Sparkles, MessageSquare, Phone, Mail, CheckCircle2, Loader2, Copy, Zap, Coffee, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  const [selectedTone, setSelectedTone] = useState('Profissional');
  const [suggestion, setSuggestion] = useState<{
    task: string;
    script: string;
    reason: string;
    channel: 'whatsapp' | 'call' | 'email';
  } | null>(null);

  const handleGenerate = (tone = selectedTone) => {
    setGenerating(true);
    // Simulate IA analysis based on history and selected tone
    setTimeout(() => {
      const scripts: Record<string, string> = {
        'Profissional': `Olá Beatriz, tudo bem? Revisitando nossos pontos da semana passada sobre o upgrade das licenças da ${companyName}. Conseguiu alinhar com o financeiro? Caso precise de algum detalhamento extra do ROI para facilitar a aprovação, me avise!`,
        'Casual': `Oi Beatriz! Tudo certo? Passando pra ver se você conseguiu ver aquele assunto das licenças. Se precisar de uma ajuda pra explicar o valor pro time, conta comigo! 😉`,
        'Urgente': `Olá Beatriz, tudo bem? Notei que o prazo para a oferta especial das licenças está expirando. Conseguimos avançar com a aprovação hoje para garantir as condições atuais?`
      };

      setSuggestion({
        task: `Follow-up ${tone.toLowerCase()} com a diretoria da ${companyName}`,
        reason: 'Última interação demonstrou interesse em expansão de licenças, mas parou no processo de aprovação interna.',
        channel: tone === 'Urgente' ? 'call' : 'whatsapp',
        script: scripts[tone] || scripts['Profissional']
      });
      setGenerating(false);
      toast.success(`Próximo passo gerado com tom ${tone}!`);
    }, 1200);
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
            <div className="py-2 text-center">
              <p className="text-[11px] text-muted-foreground mb-3">Escolha o tom da comunicação:</p>
              <PromptChips 
                chips={TONE_CHIPS} 
                onSelect={(tone) => {
                  setSelectedTone(tone);
                  handleGenerate(tone);
                }} 
                className="justify-center mb-5"
              />
              <Button 
                onClick={() => handleGenerate(selectedTone)} 
                disabled={generating}
                className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold shadow-sm"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Gerar com tom {selectedTone}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-3 rounded-lg bg-background border border-border/50 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Ação Sugerida</span>
                  <div className="flex gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-primary"
                      onClick={() => setSuggestion(null)}
                    >
                      Trocar tom
                    </Button>
                    <Badge variant="secondary" className="text-[9px] h-4 uppercase">
                      {suggestion.channel === 'whatsapp' ? <MessageSquare className="h-3 w-3 mr-1" /> : suggestion.channel === 'call' ? <Phone className="h-3 w-3 mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                      {suggestion.channel}
                    </Badge>
                  </div>
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