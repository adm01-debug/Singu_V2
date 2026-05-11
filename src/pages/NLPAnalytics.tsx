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
   UnifiedScriptGenerator
 } from '@/components/nlp';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Brain, TrendingUp, Users, Target, Search, Sparkles, Wand2, Activity } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';

const NLPAnalytics = () => {
   const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
 
   const { data: contacts } = useQuery({
     queryKey: ['nlp-contacts-search', searchTerm],
     queryFn: async () => {
       if (searchTerm.length < 2) return [];
       const { data } = await supabase
         .from('contacts')
         .select('id, name')
         .ilike('name', `%${searchTerm}%`)
         .limit(5);
       return data || [];
     },
     enabled: searchTerm.length >= 2
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
               <TabsList className="grid w-full grid-cols-4">
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
               </TabsList>
               
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
                 <CommunicationCoherencePanel />
               </TabsContent>
               
               <TabsContent value="tools" className="mt-6">
                 <UnifiedScriptGenerator />
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
                 <CardTitle className="text-sm">Próximos Passos</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {[
                   'Calibrar 5 novos leads',
                   'Testar Reenquadramento em Objeções',
                   'Revisar Scripts de Rapport'
                 ].map((task, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs">
                     <div className="h-1 w-1 rounded-full bg-primary" />
                     {task}
                   </div>
                 ))}
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </AppLayout>
    );
  };
 
 export default NLPAnalytics;

export default NLPAnalytics;