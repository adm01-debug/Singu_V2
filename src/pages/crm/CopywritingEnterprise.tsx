 import { Helmet } from 'react-helmet-async';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Sparkles, Wand2, BarChart3, History, Layers, MessageSquare } from 'lucide-react';
 import { CopyAnalyzer } from '@/components/crm/copywriting/CopyAnalyzer';
 import { SalesScriptGenerator } from '@/components/crm/copywriting/SalesScriptGenerator';
 import { PersuasionFrameworks } from '@/components/crm/copywriting/PersuasionFrameworks';
 
 export default function CopywritingEnterprise() {
   return (
     <div className="container max-w-7xl py-6 space-y-6">
       <Helmet>
         <title>Copywriting & Sales Tools (Enterprise) — Suite</title>
         <meta name="description" content="Análise de neuromarketing, gerador de scripts DISC/VAK e previews multi-canal." />
       </Helmet>
 
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
         <div className="space-y-1">
           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
             Copywriting & Sales Tools
           </h1>
           <p className="text-muted-foreground">
             Engenharia de persuasão baseada em perfis comportamentais e neuromarketing.
           </p>
         </div>
         <div className="flex gap-2">
           <div className="bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-primary text-xs font-bold border border-primary/20">
             <Sparkles className="w-3.5 h-3.5" /> MODO ENTERPRISE ATIVO
           </div>
         </div>
       </div>
 
       <Tabs defaultValue="analyzer" className="space-y-6">
         <TabsList className="bg-muted/50 p-1">
           <TabsTrigger value="analyzer" className="gap-2">
             <BarChart3 className="w-4 h-4" /> Analisador de Neuromarketing
           </TabsTrigger>
           <TabsTrigger value="scripts" className="gap-2">
             <Wand2 className="w-4 h-4" /> Gerador de Scripts IA
           </TabsTrigger>
           <TabsTrigger value="frameworks" className="gap-2">
             <Layers className="w-4 h-4" /> Frameworks de Persuasão
           </TabsTrigger>
           <TabsTrigger value="history" className="gap-2">
             <History className="w-4 h-4" /> Histórico de Performance
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="analyzer" className="space-y-4 animate-in fade-in-50 duration-500">
           <CopyAnalyzer />
         </TabsContent>
 
         <TabsContent value="scripts" className="space-y-4 animate-in fade-in-50 duration-500">
           <SalesScriptGenerator />
         </TabsContent>
 
          <TabsContent value="frameworks" className="space-y-4 animate-in fade-in-50 duration-500">
            <PersuasionFrameworks />
          </TabsContent>
 
         <TabsContent value="history" className="text-center py-20 border-2 border-dashed rounded-lg">
           <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
           <h3 className="text-lg font-medium">Histórico de Versões</h3>
           <p className="text-muted-foreground max-w-sm mx-auto">
             Compare o score de conversão de diferentes versões de sua copy ao longo do tempo.
           </p>
         </TabsContent>
       </Tabs>
     </div>
   );
 }