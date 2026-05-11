import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Header } from '@/components/layout/Header';
 import { useState } from 'react';
 import { 
   NLPConversionMetrics,
   NLPMasteryScore,
   NLPEvolutionTimeline,
   NLPInsightsDashboard,
   CommunicationCoherencePanel,
   UnifiedScriptGenerator,
   CopywritingSalesTools,
    NLPTrainingMode,
    PerceptualPositions,
    MetaProgramsProfiler
 } from '@/components/nlp';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Brain, TrendingUp, Users, Target, Search, Sparkles, Wand2, Activity, CheckCircle2, GraduationCap, Telescope, Fingerprint } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import { cn } from '@/lib/utils';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Contact } from '@/types';

const NLPAnalytics = () => {
   const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
 
   const { data: contacts } = useQuery({
     queryKey: ['nlp-contacts-search', searchTerm],
     queryFn: async () => {
       if (searchTerm.length < 2) return [];
       const { data } = await supabase
         .from('contacts')
         .select('id, first_name, last_name')
         .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
         .limit(5);
       return data?.map(c => ({ ...c, name: `${c.first_name} ${c.last_name}` })) || [];
     },
     enabled: searchTerm.length >= 2
   });
 
   const { data: selectedContact } = useQuery({
     queryKey: ['selected-contact-nlp', selectedContactId],
     queryFn: async () => {
       if (!selectedContactId) return null;
       const { data, error } = await supabase
         .from('contacts')
         .select('*, companies(name)')
         .eq('id', selectedContactId)
         .single();
       
       if (error) throw error;
 
       const contact: Contact = {
         id: data.id,
         companyId: data.company_id || '',
         companyName: (data.companies as any)?.name || 'Empresa desconhecida',
         firstName: data.first_name || '',
         lastName: data.last_name || '',
         role: (data.role as any) || 'contact',
         roleTitle: data.role_title || '',
         email: data.email || undefined,
         phone: data.phone || undefined,
         whatsapp: data.whatsapp || undefined,
         linkedin: data.linkedin || undefined,
         tags: data.tags || [],
         relationshipStage: (data.relationship_stage as any) || 'prospect',
         relationshipScore: data.relationship_score || 0,
         interactionCount: (data as any).interactions_count || 0,
         sentiment: (data.sentiment as any) || 'neutral',
         behavior: (data.behavior as any) || {},
         hobbies: data.hobbies || [],
         interests: data.interests || [],
         lifeEvents: [],
         createdAt: new Date(data.created_at),
         updatedAt: new Date(data.updated_at)
       };
 
       return contact;
     },
     enabled: !!selectedContactId
   });
 
  return (
    <AppLayout>
      <SEOHead 
        title="Análise PNL | CRM Inteligente" 
        description="Métricas avançadas de conversão baseadas em padrões de PNL, VAK e Metaprogramas." 
      />
      <Header 
        title="Análise Comportamental (PNL)" 
        subtitle="Insights avançados sobre a eficácia da comunicação e perfis de clientes"
        hideBack
      />

       <div className="p-6 space-y-6 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-3 space-y-6">
             <NLPMasteryScore />
             
             <Tabs defaultValue="overview" className="w-full">
                 <TabsList className="grid w-full grid-cols-6">
                 <TabsTrigger value="overview" className="gap-2">
                   <Activity className="h-4 w-4" /> Geral
                 </TabsTrigger>
                 <TabsTrigger value="evolution" className="gap-2">
                   <TrendingUp className="h-4 w-4" /> Evolução
                 </TabsTrigger>
                 <TabsTrigger value="coherence" className="gap-2">
                   <Sparkles className="h-4 w-4" /> Coerência
                 </TabsTrigger>
                 <TabsTrigger value="tools" className="gap-2">
                   <Wand2 className="h-4 w-4" /> Ferramentas
                 </TabsTrigger>
                  <TabsTrigger value="positions" className="gap-2">
                    <Telescope className="h-4 w-4" /> Posições
                  </TabsTrigger>
                  <TabsTrigger value="metaprograms" className="gap-2">
                    <Fingerprint className="h-4 w-4" /> Metaprogramas
                  </TabsTrigger>
                  <TabsTrigger value="training" className="gap-2">
                    <GraduationCap className="h-4 w-4" /> Treino
                  </TabsTrigger>
               </TabsList>
               
                <TabsContent value="positions" className="mt-6 space-y-6">
                  {selectedContact ? (
                    <PerceptualPositions contact={selectedContact} />
                  ) : (
                    <Card className="p-12 text-center border-dashed">
                      <p className="text-muted-foreground">Selecione um contato na aba "Evolução" para analisar posições perceptuais.</p>
                    </Card>
                  )}
                </TabsContent>

                 <TabsContent value="metaprograms" className="mt-6 space-y-6">
                   {selectedContact ? (
                     <MetaProgramsProfiler contact={selectedContact} />
                   ) : (
                     <Card className="p-12 text-center border-dashed">
                       <p className="text-muted-foreground">Selecione um contato na aba "Evolução" para analisar metaprogramas.</p>
                     </Card>
                   )}
                 </TabsContent>

                <TabsContent value="training" className="mt-6 space-y-6">
                  <NLPTrainingMode />
                </TabsContent>

               <TabsContent value="overview" className="mt-6 space-y-6">
                 <NLPConversionMetrics />
               </TabsContent>
 
               <TabsContent value="evolution" className="mt-6 space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <Card className="lg:col-span-1">
                     <CardHeader>
                       <CardTitle className="text-sm">Selecionar Contato</CardTitle>
                       <CardDescription>Visualize a evolução de um cliente específico</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input 
                           placeholder="Buscar contato..." 
                           className="pl-9"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                         />
                       </div>
                       
                       <div className="space-y-2">
                         {contacts?.map(contact => (
                           <Button 
                             key={contact.id}
                             variant={selectedContactId === contact.id ? "default" : "ghost"}
                             className="w-full justify-start gap-2"
                             onClick={() => setSelectedContactId(contact.id)}
                           >
                             <Users className="h-4 w-4" />
                             {contact.name}
                           </Button>
                         ))}
                         {searchTerm.length >= 2 && contacts?.length === 0 && (
                           <p className="text-xs text-center text-muted-foreground py-2">Nenhum contato encontrado</p>
                         )}
                       </div>
                     </CardContent>
                   </Card>
 
                   <div className="lg:col-span-2">
                     {selectedContactId ? (
                       <div className="space-y-6">
                         <NLPEvolutionTimeline contactId={selectedContactId} />
                         <NLPInsightsDashboard contactId={selectedContactId} />
                       </div>
                     ) : (
                       <Card className="h-full flex items-center justify-center p-12 text-center border-dashed">
                         <div className="space-y-3">
                           <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
                             <Search className="h-6 w-6 text-primary" />
                           </div>
                           <p className="text-muted-foreground">Selecione um contato para ver a evolução PNL detalhada.</p>
                         </div>
                       </Card>
                     )}
                   </div>
                 </div>
               </TabsContent>
               
               <TabsContent value="coherence" className="mt-6">
                 {selectedContact ? (
                   <CommunicationCoherencePanel contact={selectedContact} />
                 ) : (
                   <Card className="p-12 text-center border-dashed">
                     <p className="text-muted-foreground">Selecione um contato na aba "Evolução" para analisar a coerência.</p>
                   </Card>
                 )}
               </TabsContent>
               
               <TabsContent value="tools" className="mt-6 space-y-6">
                 {selectedContact ? (
                   <>
                     <UnifiedScriptGenerator contact={selectedContact} />
                     <CopywritingSalesTools contact={selectedContact} />
                   </>
                 ) : (
                   <Card className="p-12 text-center border-dashed">
                     <p className="text-muted-foreground">Selecione um contato na aba "Evolução" para acessar as ferramentas de PNL.</p>
                   </Card>
                 )}
               </TabsContent>
             </Tabs>
           </div>
 
           <div className="space-y-6">
             <Card className="bg-primary/5 border-primary/20">
               <CardHeader>
                 <CardTitle className="text-sm flex items-center gap-2">
                   <Sparkles className="h-4 w-4 text-primary" />
                   Estratégia do Dia
                 </CardTitle>
               </CardHeader>
               <CardContent className="text-xs space-y-4">
                 <p className="leading-relaxed">
                   Hoje, sua base está <strong>42% Visiva</strong>. Priorize o envio de propostas visuais para aumentar o engajamento subconsciente.
                 </p>
                 <div className="pt-2 border-t">
                   <p className="font-bold text-primary mb-1">Gatilho Recomendado:</p>
                   <p className="text-muted-foreground italic">"Veja como isso se encaixa perfeitamente na sua visão..."</p>
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm">Checklist de Maestria</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {[
                   { label: 'Calibrar 5 novos leads', done: true },
                   { label: 'Aplicar Sleight of Mouth', done: false },
                   { label: 'Padrão Milton em E-mails', done: true },
                   { label: 'Coerência VAK > 90%', done: false },
                   { label: 'Mapear Metaprogramas', done: true },
                 ].map((task, i) => (
                   <div key={i} className="flex items-center gap-3 group cursor-pointer">
                     <div className={cn(
                       "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                       task.done ? "bg-success border-success text-white" : "border-muted-foreground group-hover:border-primary"
                     )}>
                       {task.done && <CheckCircle2 className="h-3 w-3" />}
                     </div>
                     <span className={cn(
                       "text-xs",
                       task.done ? "text-muted-foreground line-through" : "text-foreground"
                     )}>
                       {task.label}
                     </span>
                   </div>
                 ))}
                 
                 <div className="pt-4 border-t">
                   <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                     <span>Progresso 10/10</span>
                     <span>60%</span>
                   </div>
                   <Progress value={60} className="h-1" />
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </AppLayout>
    );
  };
 
 export default NLPAnalytics;