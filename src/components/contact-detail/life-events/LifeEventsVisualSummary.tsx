 import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
 import { Tables } from '@/integrations/supabase/types';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 
 interface LifeEventsVisualSummaryProps {
   lifeEvents: Tables<'life_events'>[];
 }
 
 export function LifeEventsVisualSummary({ lifeEvents }: LifeEventsVisualSummaryProps) {
   if (!lifeEvents || lifeEvents.length === 0) return null;
 
   const typeCount = lifeEvents.reduce((acc: Record<string, number>, event) => {
     acc[event.event_type] = (acc[event.event_type] || 0) + 1;
     return acc;
   }, {});
 
   const typeLabels: Record<string, string> = {
     birthday: 'Aniversário',
     anniversary: 'Bodas',
     promotion: 'Promoção',
     travel: 'Viagem',
     family: 'Família',
     achievement: 'Conquista',
     other: 'Outro'
   };
 
   const pieData = Object.entries(typeCount).map(([type, count]) => ({
     name: typeLabels[type] || type,
     value: count
   }));
 
   const COLORS = ['#4D96FF', '#6BCB77', '#FF6B6B', '#FFD93D', '#9B59B6', '#34495E', '#95A5A6'];
 
   // Events by year (for the bar chart)
   const yearCount = lifeEvents.reduce((acc: Record<string, number>, event) => {
     const year = new Date(event.event_date).getFullYear();
     acc[year] = (acc[year] || 0) + 1;
     return acc;
   }, {});
 
   const barData = Object.entries(yearCount)
     .map(([year, count]) => ({ year, count }))
     .sort((a, b) => parseInt(a.year) - parseInt(b.year));
 
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <Card className="border-none shadow-none bg-muted/20">
         <CardHeader className="pb-2">
           <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
             Distribuição por Tipo
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={40}
                   outerRadius={70}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
 
       <Card className="border-none shadow-none bg-muted/20">
         <CardHeader className="pb-2">
           <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
             Volume de Marcos por Ano
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                 <XAxis 
                   dataKey="year" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false}
                 />
                 <YAxis 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false}
                   allowDecimals={false}
                 />
                 <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 />
                 <Bar dataKey="count" fill="#4D96FF" radius={[4, 4, 0, 0]} barSize={30} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }