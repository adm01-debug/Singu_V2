 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Eye, Volume2, Fingerprint, Save } from 'lucide-react';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactBehavior } from '@/hooks/useContactBehavior';
 import { useState, useEffect, useMemo } from 'react';
 import { NLPCalibrationCard } from '@/components/nlp/NLPCalibrationCard';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';

interface Props {
  contactId: string;
}

export function VakSubTab({ contactId }: Props) {
  const { behavior, updateBehavior, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<Partial<ContactBehavior>>({});

  useEffect(() => {
    if (behavior) setFormData(behavior);
  }, [behavior]);

   const { user } = useAuth();
   const { data: vakHistory } = useQuery({
     queryKey: ['vak-history', contactId, user?.id],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('vak_analysis_history')
         .select('*')
         .eq('contact_id', contactId)
         .order('created_at', { ascending: false })
         .limit(1);
       if (error) throw error;
       return data;
     },
     enabled: !!user && !!contactId
   });
 
   const latestVAK = useMemo(() => {
     if (!vakHistory || vakHistory.length === 0) return undefined;
     const latest = vakHistory[0];
     const scores = {
       visual: Number(latest.visual_score) || 0,
       auditory: Number(latest.auditory_score) || 0,
       kinesthetic: Number(latest.kinesthetic_score) || 0,
       digital: Number(latest.digital_score) || 0
     };
     
     const maxScore = Math.max(...Object.values(scores));
     const dominant = (Object.keys(scores) as Array<keyof typeof scores>).find(k => scores[k] === maxScore) || 'digital';
     
     return {
       ...scores,
       dominant,
       words: (latest.visual_words as string[]) || []
     };
   }, [vakHistory]);

   if (isLoading) return <div>Carregando...</div>;

   return (
     <div className="grid gap-6 md:grid-cols-2">
       <NLPCalibrationCard contactId={contactId} latestVAK={latestVAK} />
       
       <Card>
         <CardHeader>
           <CardTitle className="text-sm font-bold uppercase flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Fingerprint className="h-4 w-4 text-primary" />
               Ajuste Manual VAK
             </div>
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid gap-3 grid-cols-1">
             {[
               { id: 'visual', label: 'Visual', icon: Eye, color: 'text-blue-500', desc: 'Imagens, cores e apresentações' },
               { id: 'auditivo', label: 'Auditivo', icon: Volume2, color: 'text-green-500', desc: 'Tom de voz, diálogos e sons' },
               { id: 'cinestesico', label: 'Cinestésico', icon: Fingerprint, color: 'text-orange-500', desc: 'Sensações e experiências práticas' },
             ].map((item) => (
               <div 
                 key={item.id}
                 onClick={() => setFormData({ ...formData, vak_primary: item.id as 'visual' | 'auditivo' | 'cinestesico' })}
                 className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.vak_primary === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}`}
               >
                 <div className="flex items-center gap-2 mb-1">
                   <item.icon className={`h-4 w-4 ${item.color}`} />
                   <span className="font-bold text-xs">{item.label}</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground">{item.desc}</p>
               </div>
             ))}
           </div>
 
           <div className="space-y-2">
             <Label className="text-xs">Confirmar Canal Primário</Label>
             <Select 
               value={formData.vak_primary} 
               onValueChange={(val) => setFormData({ ...formData, vak_primary: val as 'visual' | 'auditivo' | 'cinestesico' })}
             >
               <SelectTrigger className="h-8 text-xs">
                 <SelectValue placeholder="Selecione o canal" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="visual">Visual</SelectItem>
                 <SelectItem value="auditivo">Auditivo</SelectItem>
                 <SelectItem value="cinestesico">Cinestésico</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <Button className="w-full gap-2 h-9 text-xs" onClick={() => updateBehavior(formData)}>
             <Save className="h-4 w-4" />
             Salvar Calibração
           </Button>
         </CardContent>
       </Card>
     </div>
   );
}
