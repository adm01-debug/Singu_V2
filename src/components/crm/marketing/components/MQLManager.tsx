 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { MQLCriteria, MQLClassification } from '@/hooks/useMQL';
 import { Users, ShieldCheck, Target, ArrowRightLeft, Clock, AlertCircle } from 'lucide-react';
 import { motion } from 'framer-motion';
 
 interface MQLManagerProps {
   criteria: MQLCriteria[];
   classifications: MQLClassification[];
   onHandoff: (id: string) => void;
 }
 
 export function MQLManager({ criteria, classifications, onHandoff }: MQLManagerProps) {
   const mqls = classifications.filter(c => c.status === 'mql');
   const sqls = classifications.filter(c => c.status === 'sql');
 
   return (
     <div className="space-y-6">
       <div className="grid md:grid-cols-3 gap-4">
         <Card className="bg-primary/[0.02] border-primary/10">
           <CardContent className="pt-6">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-lg bg-primary/10 text-primary">
                 <Target className="w-5 h-5" />
               </div>
               <h3 className="font-semibold">Critérios Ativos</h3>
             </div>
             <div className="space-y-2">
               {criteria.map(c => (
                 <div key={c.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border border-border/50">
                   <span className="truncate pr-2">{c.name}</span>
                   <Badge variant="secondary" className="text-[10px] shrink-0">Score {c.conditions.min_score || 0}+</Badge>
                 </div>
               ))}
               {criteria.length === 0 && (
                 <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum critério definido.</p>
               )}
             </div>
           </CardContent>
         </Card>
 
         <Card className="md:col-span-2">
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="text-base flex items-center gap-2">
                 <Users className="w-4 h-4 text-primary" />
                 Fila de Qualificação
               </CardTitle>
               <div className="flex gap-2">
                 <Badge variant="outline" className="text-[10px]">{mqls.length} MQLs</Badge>
                 <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-100">{sqls.length} SQLs</Badge>
               </div>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {mqls.slice(0, 5).map((m) => (
                 <motion.div 
                   key={m.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                       {m.score_snapshot}
                     </div>
                     <div>
                       <p className="text-sm font-medium">Lead #{m.contact_id.slice(-4).toUpperCase()}</p>
                       <div className="flex items-center gap-2 mt-0.5">
                         <Clock className="w-3 h-3 text-muted-foreground" />
                         <span className="text-[10px] text-muted-foreground">
                           Qualificado em {new Date(m.qualified_at).toLocaleDateString()}
                         </span>
                       </div>
                     </div>
                   </div>
                   <Button 
                     size="sm" 
                     className="gap-2 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                     onClick={() => onHandoff(m.id)}
                   >
                     <ArrowRightLeft className="w-3 h-3" /> Promover SQL
                   </Button>
                 </motion.div>
               ))}
               {mqls.length === 0 && (
                 <div className="text-center py-12">
                   <ShieldCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                   <p className="text-sm text-muted-foreground">Sem leads aguardando handoff no momento.</p>
                 </div>
               )}
               {mqls.length > 5 && (
                 <Button variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground uppercase tracking-widest h-8">
                   Ver todos os {mqls.length} MQLs
                 </Button>
               )}
             </div>
           </CardContent>
         </Card>
       </div>
 
       <Card className="border-amber-200 bg-amber-50/30">
         <CardContent className="py-4 flex items-center gap-3">
           <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
           <div className="text-xs">
             <span className="font-bold text-amber-900">IA Insight:</span> 
             <span className="text-amber-800 ml-1">
               Seu SLA de handoff (MQL → SQL) está em 14 minutos. Leads contactados nos primeiros 5 minutos convertem 8x mais. 
               Considere ativar o roteamento automático de SDRs.
             </span>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }