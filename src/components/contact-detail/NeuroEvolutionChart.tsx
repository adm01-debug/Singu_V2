 import React from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Brain, TrendingUp } from 'lucide-react';
 import { 
   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
 } from 'recharts';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 
 interface Props {
   contactId: string;
 }
 
 export function NeuroEvolutionChart({ contactId }: Props) {
   const { data: history, isLoading } = useQuery({
     queryKey: ['neuro-evolution', contactId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('neuro_behavioral_history')
         .select('*')
         .eq('contact_id', contactId)
         .order('created_at', { ascending: true })
         .limit(1000);
       
       if (error) throw error;
       
       return data.map(entry => ({
         date: format(new Date(entry.created_at), 'dd/MM', { locale: ptBR }),
         fullDate: format(new Date(entry.created_at), "dd 'de' MMM", { locale: ptBR }),
        reptilian: (entry.dominance_data as { reptilian?: number } | null)?.reptilian || 0,
        limbic: (entry.dominance_data as { limbic?: number } | null)?.limbic || 0,
        neocortex: (entry.dominance_data as { neocortex?: number } | null)?.neocortex || 0,
         empathy: entry.empathy_score || 0
       }));
     }
   });
 
   if (isLoading) return <div className="h-48 animate-pulse bg-muted rounded-lg" />;
   if (!history || history.length < 1) {
     return (
       <Card className="border-dashed bg-muted/20">
         <CardContent className="pt-6 text-center py-10">
           <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
           <p className="text-sm text-muted-foreground">Histórico insuficiente para mostrar evolução neurocomportamental.</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm font-bold flex items-center gap-2">
           <Brain className="h-4 w-4 text-primary" />
            Timeline de Neuromarketing & Evolução
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="h-[250px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={history}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
               <XAxis 
                 dataKey="date" 
                 fontSize={10} 
                 tickLine={false} 
                 axisLine={false} 
               />
               <YAxis 
                 fontSize={10} 
                 tickLine={false} 
                 axisLine={false} 
                 tickFormatter={(value) => `${value}%`}
               />
               <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
               />
                <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
               <Line 
                 type="monotone" 
                 name="Reptiliano" 
                 dataKey="reptilian" 
                 stroke="#f97316" 
                 strokeWidth={2} 
                 dot={{ r: 4 }} 
                 activeDot={{ r: 6 }} 
               />
               <Line 
                 type="monotone" 
                 name="Límbico" 
                 dataKey="limbic" 
                 stroke="#ec4899" 
                 strokeWidth={2} 
                 dot={{ r: 4 }} 
                 activeDot={{ r: 6 }} 
               />
               <Line 
                 type="monotone" 
                 name="Neocórtex" 
                 dataKey="neocortex" 
                 stroke="#6366f1" 
                 strokeWidth={2} 
                 dot={{ r: 4 }} 
                 activeDot={{ r: 6 }} 
               />
             </LineChart>
           </ResponsiveContainer>
         </div>
       </CardContent>
     </Card>
   );
 }