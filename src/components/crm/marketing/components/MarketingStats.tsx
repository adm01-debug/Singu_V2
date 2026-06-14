 import { Card, CardContent } from '@/components/ui/card';
  import { Eye, FileText, Users, TrendingUp } from 'lucide-react';
 import { motion } from 'framer-motion';
 
 interface MarketingStatsProps {
   totalViews: number;
   totalSubmissions: number;
   activeNurturing: number;
   totalSQLs: number;
 }
 
  export function MarketingStats({ totalViews, totalSubmissions, activeNurturing, totalSQLs }: MarketingStatsProps) {
    const stats = [
      { label: 'Lead Magnets', value: totalViews, sub: 'Total de visualizações', icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Submissões', value: totalSubmissions, sub: 'Conversões em forms', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'MQLs → SQLs', value: totalSQLs, sub: 'Prontos para vendas', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
      { 
        label: 'ROI Estimado', 
        value: '12.4x', 
        sub: 'Retorno sobre investimento', 
        icon: TrendingUp, 
        color: 'text-purple-500', 
        bg: 'bg-purple-500/10',
        isCurrency: false 
      },
    ];
 
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       {stats.map((stat, i) => (
         <motion.div
           key={stat.label}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: i * 0.1 }}
         >
           <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
             <CardContent className="p-6 relative">
               <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-50`} />
               <div className="flex items-center justify-between relative z-10">
                 <div className="space-y-1">
                   <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                   <h3 className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</h3>
                   <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                 </div>
                 <div className={`p-3 rounded-2xl ${stat.bg}`}>
                   <stat.icon className={`w-6 h-6 ${stat.color}`} />
                 </div>
               </div>
             </CardContent>
           </Card>
         </motion.div>
       ))}
     </div>
   );
 }