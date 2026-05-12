 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
 import { History, TrendingUp, ArrowUpRight, MessageSquare, Target } from 'lucide-react';
 
 const PERFORMANCE_DATA = [
   { date: '2024-03-01', score: 65, conversions: 12, clicks: 145 },
   { date: '2024-03-05', score: 72, conversions: 18, clicks: 189 },
   { date: '2024-03-10', score: 88, conversions: 31, clicks: 240 },
   { date: '2024-03-15', score: 82, conversions: 25, clicks: 210 },
   { date: '2024-03-20', score: 94, conversions: 42, clicks: 312 },
 ];
 
 const VERSIONS = [
   { id: 1, name: 'Pitch Direto (Controle)', framework: 'AIDA', score: 65, date: '01/03/2024', status: 'Inativo' },
   { id: 2, name: 'Foco na Dor', framework: 'PAS', score: 72, date: '05/03/2024', status: 'Inativo' },
   { id: 3, name: 'Vantagens B2B', framework: 'FAB', score: 88, date: '10/03/2024', status: 'Inativo' },
   { id: 4, name: 'Jornada do Herói V1', framework: 'Storytelling', score: 94, date: '20/03/2024', status: 'Ativo' },
 ];
 
 export const PerformanceHistory = () => {
   return (
     <div className="space-y-6">
       <div className="grid md:grid-cols-3 gap-4">
         <Card className="bg-primary/5 border-primary/20">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-medium text-muted-foreground uppercase">Média de Score</p>
                 <h3 className="text-2xl font-bold">80.2%</h3>
               </div>
               <div className="p-2 bg-primary/10 rounded-full">
                 <TrendingUp className="w-5 h-5 text-primary" />
               </div>
             </div>
             <div className="mt-4 flex items-center text-xs text-green-600">
               <ArrowUpRight className="w-3 h-3 mr-1" />
               <span>+15% vs mês anterior</span>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-medium text-muted-foreground uppercase">Conversões Totais</p>
                 <h3 className="text-2xl font-bold">128</h3>
               </div>
               <div className="p-2 bg-blue-100 rounded-full">
                 <Target className="w-5 h-5 text-blue-600" />
               </div>
             </div>
             <div className="mt-4 flex items-center text-xs text-green-600">
               <ArrowUpRight className="w-3 h-3 mr-1" />
               <span>+8.2% vs meta</span>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs font-medium text-muted-foreground uppercase">Top Framework</p>
                 <h3 className="text-2xl font-bold">Storytelling</h3>
               </div>
               <div className="p-2 bg-purple-100 rounded-full">
                 <MessageSquare className="w-5 h-5 text-purple-600" />
               </div>
             </div>
             <div className="mt-4 text-xs text-muted-foreground">
               94% de score médio
             </div>
           </CardContent>
         </Card>
       </div>
 
       <div className="grid lg:grid-cols-2 gap-6">
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <History className="w-4 h-4 text-primary" />
               Evolução do Copy Score
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={PERFORMANCE_DATA}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.split('-')[2]} />
                   <YAxis fontSize={10} domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="score" 
                     stroke="hsl(var(--primary))" 
                     strokeWidth={3} 
                     dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                     activeDot={{ r: 6 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-bold flex items-center gap-2">
               <Target className="w-4 h-4 text-primary" />
               Conversões por Período
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={PERFORMANCE_DATA}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => val.split('-')[2]} />
                   <YAxis fontSize={10} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                   />
                   <Bar dataKey="conversions" fill="rgba(59, 130, 246, 0.8)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="text-sm font-bold">Log de Versões Enterprise</CardTitle>
           <CardDescription>Rastreabilidade completa de todas as variações de copy testadas.</CardDescription>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Versão</TableHead>
                 <TableHead>Framework</TableHead>
                 <TableHead>Score</TableHead>
                 <TableHead>Data</TableHead>
                 <TableHead>Status</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {VERSIONS.map((v) => (
                 <TableRow key={v.id}>
                   <TableCell className="font-medium text-xs">{v.name}</TableCell>
                   <TableCell className="text-xs">
                     <Badge variant="outline">{v.framework}</Badge>
                   </TableCell>
                   <TableCell className="text-xs font-bold text-primary">{v.score}%</TableCell>
                   <TableCell className="text-xs text-muted-foreground">{v.date}</TableCell>
                   <TableCell>
                     <Badge variant={v.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px]">
                       {v.status}
                     </Badge>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
     </div>
   );
 };