 import { Target, Save, Info, Wand2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useContactBehavior } from '@/hooks/useContactBehavior';
 import { useState, useEffect } from 'react';
 import { useAuth } from '@/hooks/useAuth';
 import { useQuery, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  contactId: string;
}

 export function MetaprogramsSubTab({ contactId }: Props) {
   const { metaprograms, updateMetaprograms, isLoading } = useContactBehavior(contactId);
   const [formData, setFormData] = useState<any>({});
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const { data: metaHistory, isLoading: loadingHistory } = useQuery({
     queryKey: ['meta-history', contactId, user?.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('metaprogram_analysis')
         .select('*')
         .eq('contact_id', contactId)
         .order('created_at', { ascending: false })
         .limit(1);
       if (error) throw error;
       return data;
     },
     enabled: !!user && !!contactId
   });
 
   const latestMeta = metaHistory?.[0];
 

  useEffect(() => {
    if (metaprograms) setFormData(metaprograms);
  }, [metaprograms]);

  if (isLoading) return <div className="p-8 text-center">Carregando metaprogramas...</div>;

  const handleSave = () => updateMetaprograms(formData);

  const sliders = [
    { 
      label: 'Direção da Motivação', 
      left: 'Toward (Aproximação)', 
      right: 'Away-From (Afastamento)', 
      leftKey: 'toward_score', 
      rightKey: 'away_from_score',
      tooltip: 'Toward foca em objetivos; Away-From foca em evitar problemas.'
    },
    { 
      label: 'Fonte de Autoridade', 
      left: 'Interno (Self)', 
      right: 'Externo (Others)', 
      leftKey: 'internal_score', 
      rightKey: 'external_score',
      tooltip: 'Interno decide por si; Externo precisa de validação de terceiros.'
    },
    { 
      label: 'Estilo de Decisão', 
      left: 'Opções (Creativity)', 
      right: 'Procedimentos (Rules)', 
      leftKey: 'options_score', 
      rightKey: 'procedures_score',
      tooltip: 'Opções gosta de criar novos caminhos; Procedimentos segue passos definidos.'
    },
    { 
      label: 'Estilo de Ação', 
      left: 'Proativo (Direct)', 
      right: 'Reativo (Wait)', 
      leftKey: 'proactive_score', 
      rightKey: 'reactive_score',
      tooltip: 'Proativo toma a iniciativa; Reativo analisa antes de agir.'
    },
    { 
      label: 'Tamanho do Chunk', 
      left: 'Global (Big Picture)', 
      right: 'Detalhe (Specific)', 
      leftKey: 'global_score', 
      rightKey: 'detail_score',
      tooltip: 'Global foca na visão geral; Detalhe foca na minúcia dos dados.'
    },
  ];

   return (
     <div className="space-y-6">
       {latestMeta && (
         <Card className="border-primary/20 bg-primary/5">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-primary">
               <Wand2 className="h-3.5 w-3.5" /> Última Detecção IA
             </CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3">
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground uppercase font-bold">Direção</p>
               <Badge variant="outline" className="text-[10px] bg-card">
                 {latestMeta.toward_score > latestMeta.away_from_score ? 'Toward' : 'Away-From'}
               </Badge>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground uppercase font-bold">Referência</p>
               <Badge variant="outline" className="text-[10px] bg-card">
                 {latestMeta.internal_score > latestMeta.external_score ? 'Interno' : 'Externo'}
               </Badge>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground uppercase font-bold">Estilo</p>
               <Badge variant="outline" className="text-[10px] bg-card">
                 {latestMeta.options_score > latestMeta.procedures_score ? 'Opções' : 'Procedimentos'}
               </Badge>
             </div>
             {latestMeta.toward_words?.length > 0 && (
               <div className="col-span-full mt-2">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Palavras-chave detectadas</p>
                 <div className="flex flex-wrap gap-1">
                   {[...latestMeta.toward_words, ...latestMeta.away_from_words, ...latestMeta.internal_words, ...latestMeta.external_words].slice(0, 10).map((w: string, i: number) => (
                     <span key={i} className="text-[10px] px-1.5 py-0.5 bg-card border rounded italic">"{w}"</span>
                   ))}
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       )}
 
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-3">
           <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase">
             <Target className="h-4 w-4 text-primary" />
             Metaprogramas & Filtros Mentais
           </CardTitle>
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => queryClient.invalidateQueries({ queryKey: ['meta-history', contactId] })}>
               <RefreshCw className="h-4 w-4 text-muted-foreground" />
             </Button>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                 </TooltipTrigger>
                 <TooltipContent>
                   <p className="max-w-xs text-xs">Os metaprogramas são os filtros que as pessoas usam para processar informações e tomar decisões.</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           </div>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid gap-6 md:grid-cols-2">
          {sliders.map((s) => {
            const leftVal = formData[s.leftKey] || 0;
            const rightVal = formData[s.rightKey] || 0;
            const total = leftVal + rightVal;
            const leftPct = total > 0 ? (leftVal / total) * 100 : 50;

            return (
              <div key={s.label} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs font-semibold">{s.label}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent><p className="text-[10px]">{s.tooltip}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">{s.left}</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" max="100" 
                        value={leftVal} 
                        onChange={(e) => setFormData({ ...formData, [s.leftKey]: parseInt(e.target.value) || 0 })}
                        className="h-7 text-xs w-16"
                      />
                      <Progress value={leftVal} className="h-1 flex-1" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase text-right block">{s.right}</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={rightVal} className="h-1 flex-1" />
                      <Input 
                        type="number" 
                        min="0" max="100" 
                        value={rightVal} 
                        onChange={(e) => setFormData({ ...formData, [s.rightKey]: parseInt(e.target.value) || 0 })}
                        className="h-7 text-xs w-16"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden mt-2">
                  <div 
                    className="absolute h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ 
                      left: '0', 
                      width: `${leftPct}%`,
                      opacity: 0.7
                    }}
                  />
                  <div 
                    className="absolute h-full bg-accent transition-all duration-500 ease-in-out"
                    style={{ 
                      right: '0', 
                      width: `${100 - leftPct}%`,
                      opacity: 0.7
                    }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-background z-10" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Notas Adicionais sobre Processamento</Label>
          <Textarea 
            value={formData.notes || ""} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Descreva observações sobre como o contato processa informações e toma decisões..."
            className="min-h-[80px]"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Metaprogramas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
