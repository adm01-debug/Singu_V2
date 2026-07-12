 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Activity, Save, Sparkles, Wand2 } from 'lucide-react';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Label } from '@/components/ui/label';
 import { Slider } from '@/components/ui/slider';
 import { Textarea } from '@/components/ui/textarea';
 import { Button } from '@/components/ui/button';
 import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactBehavior } from '@/hooks/useContactBehavior';
 import { useDISCAutoAnalysis } from '@/hooks/useDISCAutoAnalysis';
 import { useState, useEffect } from 'react';
 import { 
   DISCEvolutionTimeline, 
   DISCSalesScriptGenerator, 
   DISCTemplateLibrary 
 } from '@/components/disc';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  contactId: string;
}

export function DiscSubTab({ contactId }: Props) {
  const { behavior, updateBehavior, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<Partial<ContactBehavior>>({});

  useEffect(() => {
    if (behavior) setFormData(behavior);
  }, [behavior]);

   const { analyzing, analyzeLatestInteractions } = useDISCAutoAnalysis();

  if (isLoading) { return <div>Carregando...</div>; }

   return (
     <div className="space-y-6">
       <div className="grid gap-6 md:grid-cols-2">
         <Card className="relative overflow-hidden">
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" />
                 Perfil DISC Atual
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="h-8 gap-1.5 text-xs font-semibold bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all"
                 onClick={() => analyzeLatestInteractions(contactId)}
                 disabled={analyzing}
               >
                 <Wand2 className={analyzing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5 text-primary"} />
                 {analyzing ? 'Analisando...' : 'IA Auto-Detect'}
               </Button>
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label>Perfil Primário</Label>
               <Select 
                 value={formData.disc_primary} 
                 onValueChange={(val) => setFormData({ ...formData, disc_primary: val as 'D' | 'I' | 'S' | 'C' })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="D">Dominância (D)</SelectItem>
                   <SelectItem value="I">Influência (I)</SelectItem>
                   <SelectItem value="S">Estabilidade (S)</SelectItem>
                   <SelectItem value="C">Conformidade (C)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Confiança ({formData.disc_confidence || 0}%)</Label>
               <Slider 
                 value={[formData.disc_confidence || 0]} 
                 max={100} step={1}
                 onValueChange={(val) => setFormData({ ...formData, disc_confidence: val[0] })}
               />
             </div>
             <div className="space-y-2">
               <Label>Notas do Perfil</Label>
               <Textarea 
                 value={formData.disc_notes || ""} 
                 onChange={(e) => setFormData({ ...formData, disc_notes: e.target.value })}
                 placeholder="Observações sobre o comportamento..."
                 className="min-h-[80px]"
               />
             </div>
             <Button className="w-full gap-2" onClick={() => updateBehavior(formData)}>
               <Save className="h-4 w-4" />
               Salvar Perfil
             </Button>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-warning" />
               Inteligência de Vendas
             </CardTitle>
           </CardHeader>
           <CardContent>
             <DISCSalesScriptGenerator contact={{ id: contactId, behavior: formData, firstName: 'Contato' } as unknown as import('@/types').Contact} />
           </CardContent>
         </Card>
       </div>
 
       <Tabs defaultValue="timeline" className="w-full">
         <TabsList className="grid w-full grid-cols-2">
           <TabsTrigger value="timeline">Evolução Comportamental</TabsTrigger>
           <TabsTrigger value="templates">Templates Adaptados</TabsTrigger>
         </TabsList>
         <TabsContent value="timeline" className="mt-4">
           <DISCEvolutionTimeline contactId={contactId} />
         </TabsContent>
         <TabsContent value="templates" className="mt-4">
           <DISCTemplateLibrary filterProfile={formData.disc_primary} />
         </TabsContent>
       </Tabs>
     </div>
   );
}
