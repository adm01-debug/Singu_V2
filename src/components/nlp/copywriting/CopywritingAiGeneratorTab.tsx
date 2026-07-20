import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Copy, CheckCircle, Brain, Target, MessageSquare, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types';
import { toast } from 'sonner';
import { useTonePersistence, ToneType } from '@/hooks/useTonePersistence';
import { logger } from '@/lib/logger';

interface Props {
  contact: Contact;
}

interface AiSuggestion {
  id: string;
  label: string;
  message: string;
  reasoning: string;
}

export function CopywritingAiGeneratorTab({ contact }: Props) {
  const { preferredTone, saveTone } = useTonePersistence(contact.companyId);
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState('introduction');
  const [framework, setFramework] = useState('None');
  const [storyArc, setStoryArc] = useState('hero_journey');
  const [tone, setTone] = useState<ToneType>('friendly');
  const [customContext, setCustomContext] = useState('');
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (preferredTone) {
      setTone(preferredTone);
    }
  }, [preferredTone]);
 
   const generateAiScripts = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase.functions.invoke('ai-writing-assistant', {
         body: {
           contact: {
             firstName: contact.firstName,
             lastName: contact.lastName,
             roleTitle: contact.roleTitle,
             companyName: contact.companyName,
             discProfile: contact.behavior?.discProfile,
             preferredChannel: contact.behavior?.preferredChannel,
             messageStyle: contact.behavior?.messageStyle,
             formalityLevel: contact.behavior?.formalityLevel || 3,
           },
           messageType,
           customContext,
           tone,
            framework,
            storyArc: framework === 'Storytelling' ? storyArc : undefined,
         }
       });
 
       if (error) throw error;
 
       setSuggestions(data.suggestions || []);
       setTips(data.tips || []);
       toast.success('Sugestões geradas com sucesso!');
     } catch (error) {
       logger.error('Error generating AI scripts:', error);
       toast.error('Erro ao gerar scripts com IA.');
     } finally {
       setLoading(false);
     }
   };
 
   const copyToClipboard = (text: string, id: string) => {
     navigator.clipboard.writeText(text)
       .then(() => { setCopiedId(id); toast.success('Copiado!'); setTimeout(() => setCopiedId(null), 2000); })
       .catch(() => toast.error('Não foi possível copiar'));
   };
 
   return (
     <div className="space-y-6">
       <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6">
         <div className="flex items-center gap-2 mb-4">
           <Sparkles className="h-5 w-5 text-primary" />
           <h4 className="font-bold text-lg">Gerador de Scripts com IA Elite</h4>
         </div>
 
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Mensagem</label>
             <Select value={messageType} onValueChange={setMessageType}>
               <SelectTrigger>
                 <SelectValue placeholder="Selecione o tipo" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="introduction">Apresentação</SelectItem>
                 <SelectItem value="follow_up">Follow-up</SelectItem>
                 <SelectItem value="proposal">Proposta comercial</SelectItem>
                 <SelectItem value="meeting_request">Solicitar reunião</SelectItem>
                 <SelectItem value="check_in">Check-in casual</SelectItem>
                 <SelectItem value="custom">Personalizado</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Framework</label>
             <Select value={framework} onValueChange={setFramework}>
               <SelectTrigger>
                 <SelectValue placeholder="Selecione o framework" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="None">Natural (Sem framework)</SelectItem>
                 <SelectItem value="AIDA">AIDA (Atenção/Ação)</SelectItem>
                 <SelectItem value="PAS">PAS (Problema/Solução)</SelectItem>
                 <SelectItem value="FAB">FAB (Recurso/Benefício)</SelectItem>
                 <SelectItem value="4Ps">4Ps (Promessa/Push)</SelectItem>
                 <SelectItem value="Storytelling">Storytelling</SelectItem>
                 <SelectItem value="Carnegie">Carnegie (Relacionamento)</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tom de Voz</label>
                <Button 
                  variant="ghost" 
                  size="icon" aria-label="Salvar como preferência" 
                  className="h-4 w-4 text-muted-foreground hover:text-primary" 
                  title="Salvar como preferência"
                  onClick={() => saveTone(tone)}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>
              <Select value={tone} onValueChange={(val: ToneType) => setTone(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Amigável Profissional</SelectItem>
                  <SelectItem value="formal">Executivo/Formal</SelectItem>
                  <SelectItem value="casual">Casual/Descontraído</SelectItem>
                </SelectContent>
              </Select>
            </div>
         </div>
 
          {framework === 'Storytelling' && (
            <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Arco Narrativo</label>
              <Select value={storyArc} onValueChange={setStoryArc}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o arco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero_journey">Jornada do Herói (Desafio → Transformação)</SelectItem>
                  <SelectItem value="before_after">Antes e Depois (Cenário A → Ponte → Cenário B)</SelectItem>
                  <SelectItem value="problem_solution">Problema → Agitação → Solução</SelectItem>
                  <SelectItem value="rags_to_riches">Da Lama ao Luxo (Superação Financeira)</SelectItem>
                  <SelectItem value="overcoming_monster">Superando o Monstro (Vencendo Grande Obstáculo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

         <div className="space-y-2 mb-6">
           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contexto Adicional (Opcional)</label>
           <Textarea 
             placeholder="Ex: Mencione que nos conhecemos no evento Web Summit ou que vi o post dele no LinkedIn..."
             value={customContext}
             onChange={(e) => setCustomContext(e.target.value)}
             className="min-h-[100px] bg-white/50"
           />
         </div>
 
         <Button 
           className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" 
           onClick={generateAiScripts}
           disabled={loading}
         >
           {loading ? (
             <>
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
               Processando Neuro-Copy...
             </>
           ) : (
             <>
               <Brain className="mr-2 h-5 w-5" />
               Gerar Scripts Personalizados
             </>
           )}
         </Button>
       </div>
 
       {tips.length > 0 && (
         <div className="flex flex-wrap gap-2 mb-4">
           {tips.map((tip, i) => (
             <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
               <Target className="h-3 w-3 mr-1" /> {tip}
             </Badge>
           ))}
         </div>
       )}
 
       <div className="grid grid-cols-1 gap-6">
         {suggestions.map((sug) => (
           <Card key={sug.id} className="border-primary/10 overflow-hidden group hover:border-primary/30 transition-all">
             <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b">
               <div className="flex items-center gap-2">
                 <Badge className="bg-primary">{sug.label}</Badge>
                 <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Sugestão {sug.id}</span>
<Button size="icon" aria-label="Confirmar" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(sug.message, sug.id)}>
                 {copiedId === sug.id ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
               </Button>h-4 w-4" />}
               </Button>
             </div>
             <CardContent className="p-4">
               <div className="bg-white rounded-lg p-4 border border-dashed mb-3 text-sm leading-relaxed whitespace-pre-wrap">
                 {sug.message}
               </div>
               <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded">
                 <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                 <div>
                   <span className="font-bold text-primary mr-1">Raciocínio IA:</span>
                   {sug.reasoning}
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       {suggestions.length === 0 && !loading && (
         <div className="text-center py-12 text-muted-foreground">
           <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
           <p>Configure as opções acima e clique em gerar para criar scripts de vendas otimizados.</p>
         </div>
       )}
     </div>
   );
 }