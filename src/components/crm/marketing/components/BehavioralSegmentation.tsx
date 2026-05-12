 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { useContactSegmentation } from '@/hooks/useContactSegmentation';
 import { Filter, Plus, Trash2, Users, Sparkles, MessageSquare, Target, Zap } from 'lucide-react';
 import { motion, AnimatePresence } from 'framer-motion';
 
 export function BehavioralSegmentation() {
   const { 
     segment, addFilter, removeFilter, setLogic, clearFilters, 
     filteredContacts, availableFields 
   } = useContactSegmentation();
 
   const getMessageRecommendation = (contact: any) => {
     const disc = contact.disc_primary || 'Desconhecido';
     const vak = contact.vak_primary || 'Desconhecido';
     const stage = contact.relationship_stage || 'lead';
 
     const recommendations: Record<string, string> = {
       'D': 'Foco em resultados e eficiência. Seja direto e breve.',
       'I': 'Foco em entusiasmo e reconhecimento. Use linguagem positiva e social.',
       'S': 'Foco em estabilidade e suporte. Seja calmo e demonstre confiabilidade.',
       'C': 'Foco em precisão e dados. Use evidências, tabelas e lógica.',
       'visual': 'Use imagens, diagramas e termos como "veja", "claro", "perspectiva".',
       'auditivo': 'Use áudios, chamadas e termos como "ouça", "soar", "harmonia".',
       'cinestesico': 'Foco em experiência e termos como "sinta", "toque", "concreto".',
     };
 
     return {
       disc: recommendations[disc] || 'Sem recomendação DISC disponível.',
       vak: recommendations[vak] || 'Sem recomendação VAK disponível.',
       strategy: stage === 'lead' ? 'Conscientização & Educação' : stage === 'prospect' ? 'Prova Social & Comparação' : 'Retenção & Up-sell'
     };
   };
 
   return (
     <div className="space-y-6">
       <div className="grid lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 border-primary/20 bg-primary/[0.01]">
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Filter className="w-4 h-4 text-primary" />
               Filtros Inteligentes
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
               <Button 
                 variant={segment.logic === 'and' ? 'default' : 'ghost'} 
                 size="sm" 
                 className="flex-1 text-xs h-7"
                 onClick={() => setLogic('and')}
               >
                 TODOS (AND)
               </Button>
               <Button 
                 variant={segment.logic === 'or' ? 'default' : 'ghost'} 
                 size="sm" 
                 className="flex-1 text-xs h-7"
                 onClick={() => setLogic('or')}
               >
                 QUALQUER (OR)
               </Button>
             </div>
 
             <div className="space-y-3">
               <AnimatePresence>
                 {segment.filters.map((f, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 10 }}
                     className="flex items-center gap-2 group"
                   >
                     <Badge variant="secondary" className="flex-1 justify-start py-1.5 px-3 h-auto font-normal">
                       <span className="font-bold mr-1">{availableFields.find(af => af.key === f.field)?.label}:</span>
                       <span className="truncate max-w-[100px]">{f.value}</span>
                     </Badge>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => removeFilter(idx)}
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </Button>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
 
             <div className="pt-4 border-t space-y-3">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Adicionar Filtro</p>
               <Select onValueChange={(field) => {
                 const fieldDef = availableFields.find(af => af.key === field);
                 addFilter({ field, operator: fieldDef?.type === 'number' ? 'gt' : 'eq', value: '' });
               }}>
                 <SelectTrigger className="h-9 text-xs">
                   <SelectValue placeholder="Selecionar campo..." />
                 </SelectTrigger>
                 <SelectContent>
                   {availableFields.map(f => (
                     <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {segment.filters.length > 0 && (
               <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8" onClick={clearFilters}>
                 Limpar tudo
               </Button>
             )}
           </CardContent>
         </Card>
 
         <div className="lg:col-span-2 space-y-6">
           <Card>
             <CardHeader className="pb-3 flex flex-row items-center justify-between">
               <CardTitle className="text-base flex items-center gap-2">
                 <Users className="w-4 h-4 text-primary" />
                 Público Segmentado
               </CardTitle>
               <Badge variant="outline" className="text-[10px]">{filteredContacts.length} contatos encontrados</Badge>
             </CardHeader>
             <CardContent>
               <div className="rounded-lg border overflow-hidden">
                 <div className="max-h-[300px] overflow-y-auto">
                   {filteredContacts.length > 0 ? (
                     <table className="w-full text-sm">
                       <thead className="bg-muted/50 sticky top-0">
                         <tr>
                           <th className="text-left p-3 font-medium text-xs">Nome</th>
                           <th className="text-left p-3 font-medium text-xs">DISC/VAK</th>
                           <th className="text-left p-3 font-medium text-xs">Estágio</th>
                           <th className="text-right p-3 font-medium text-xs">Ação</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {filteredContacts.map(c => (
                           <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                             <td className="p-3">
                               <p className="font-medium">{c.first_name} {c.last_name}</p>
                               <p className="text-[10px] text-muted-foreground">{c.email}</p>
                             </td>
                             <td className="p-3">
                               <div className="flex gap-1">
                                 {c.disc_primary && <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[10px] h-5">{c.disc_primary}</Badge>}
                                 {c.vak_primary && <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 text-[10px] h-5 capitalize">{c.vak_primary[0]}</Badge>}
                               </div>
                             </td>
                             <td className="p-3 capitalize text-xs">
                               {c.relationship_stage}
                             </td>
                             <td className="p-3 text-right">
                               <Button variant="ghost" size="icon" className="h-7 w-7">
                                 <Zap className="w-3.5 h-3.5 text-primary" />
                               </Button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   ) : (
                     <div className="py-20 text-center space-y-2">
                       <Users className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                       <p className="text-sm text-muted-foreground">Nenhum contato corresponde aos filtros.</p>
                     </div>
                   )}
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <div className="grid md:grid-cols-2 gap-4">
             <Card className="border-emerald-200 bg-emerald-50/20 shadow-sm">
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-emerald-800">
                   <Sparkles className="w-3.5 h-3.5" />
                   Estratégia de Mensagem (IA)
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {filteredContacts.length > 0 ? (
                   <div className="space-y-3">
                     <div className="p-2 rounded bg-white/80 border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                       {getMessageRecommendation(filteredContacts[0]).disc}
                     </div>
                     <div className="p-2 rounded bg-white/80 border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                       {getMessageRecommendation(filteredContacts[0]).vak}
                     </div>
                     <Badge className="bg-emerald-600 text-white border-none text-[9px] uppercase tracking-tighter">
                       Foco: {getMessageRecommendation(filteredContacts[0]).strategy}
                     </Badge>
                   </div>
                 ) : (
                   <p className="text-[11px] text-muted-foreground italic">Selecione um público para ver recomendações.</p>
                 )}
               </CardContent>
             </Card>
 
             <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
                   <Target className="w-3.5 h-3.5" />
                   Próximos Passos
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <Button className="w-full justify-start gap-2 h-9 text-xs" size="sm">
                   <MessageSquare className="w-3.5 h-3.5" /> Criar Campanha de Email
                 </Button>
                 <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs" size="sm">
                   <Users className="w-3.5 h-3.5" /> Exportar Lista de Público
                 </Button>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </div>
   );
 }