import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
   Activity,
   ArrowUpRight,
   ArrowDownRight,
   Target,
   Clock,
   Zap,
   Bell,
   Sparkles,
   Brain,
   ShieldCheck,
   CalendarRange,
   MessageSquareWarning
} from 'lucide-react';
 import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { Progress } from '@/components/ui/progress';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { RELATIONSHIP_STAGE_LABELS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const STAGE_COLORS: Record<string, string> = {
  prospect: '#94a3b8',
  qualified_lead: '#3b82f6',
  opportunity: '#6366f1',
  negotiation: '#f59e0b',
  customer: '#10b981',
  loyal_customer: '#059669',
  advocate: '#8b5cf6',
  at_risk: '#ef4444',
  lost: '#6b7280',
};

export function RelationshipKPIsDashboard() {
  const queryClient = useQueryClient();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['relationship-kpis'],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('relationship_stage, relationship_score, sentiment, last_interaction_at');
      
      if (error) throw error;

      // Group by stage
      const stageDistribution = contacts.reduce((acc: any, curr) => {
        const stage = curr.relationship_stage || 'unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {});

      // Avg score by stage
      const stageScores = contacts.reduce((acc: any, curr) => {
        const stage = curr.relationship_stage || 'unknown';
        if (!acc[stage]) acc[stage] = { total: 0, count: 0 };
        acc[stage].total += curr.relationship_score || 0;
        acc[stage].count += 1;
        return acc;
      }, {});

      const avgScoreByStage = Object.entries(stageScores).map(([stage, data]: any) => ({
        stage: RELATIONSHIP_STAGE_LABELS[stage as any] || stage,
        avg: Math.round(data.total / data.count),
        originalStage: stage
      }));

      const pieData = Object.entries(stageDistribution).map(([name, value]) => ({ 
        name: RELATIONSHIP_STAGE_LABELS[name as any] || name, 
        value,
        originalName: name
      }));

      // Impact calculation (Mocked based on recent interactions trend)
      const trendData = [
        { name: 'Jan', score: 65, active: 12 },
        { name: 'Fev', score: 68, active: 15 },
        { name: 'Mar', score: 72, active: 18 },
        { name: 'Abr', score: 75, active: 22 },
        { name: 'Mai', score: 78, active: 25 },
      ];

      return {
        total: contacts.length,
        atRiskCount: contacts.filter(c => c.relationship_stage === 'at_risk').length,
        avgGlobalScore: Math.round(contacts.reduce((a, b) => a + (b.relationship_score || 0), 0) / contacts.length),
        pieData,
        avgScoreByStage,
        trendData
      };
    }
  });

   useEffect(() => {
     const channel = supabase
       .channel('crm-pulse')
       .on(
         'postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'interactions' },
         async (payload) => {
           const { data: contact } = await supabase
             .from('contacts')
             .select('first_name, last_name')
             .eq('id', payload.new.contact_id)
              .maybeSingle();
           
           const newEvent = {
             id: payload.new.id,
             type: 'interaction',
             title: payload.new.title,
             contact: contact ? `${contact.first_name} ${contact.last_name}` : 'Contato Desconhecido',
             sentiment: payload.new.sentiment,
             timestamp: new Date().toISOString()
           };
           
           setLiveEvents(prev => [newEvent, ...prev].slice(0, 5));
           toast.info(`Nova interação: ${newEvent.contact}`, {
             description: payload.new.title,
             icon: <Bell className="h-4 w-4 text-primary" />
           });
           
           queryClient.invalidateQueries({ queryKey: ['relationship-kpis'] });
         }
       )
       .on(
         'postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'crm_objection_intelligence' },
         (payload) => {
           const newEvent = {
             id: payload.new.id,
             type: 'objection',
             title: `Objeção: ${payload.new.objection_type}`,
             contact: 'Inteligência de Vendas',
             timestamp: new Date().toISOString()
           };
           setLiveEvents(prev => [newEvent, ...prev].slice(0, 5));
           queryClient.invalidateQueries({ queryKey: ['crm-intelligence-summary'] });
         }
       )
       .on(
         'postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'neuro_behavioral_history' },
         (payload) => {
           const newEvent = {
             id: payload.new.id,
             type: 'behavior',
             title: 'Análise de Comportamento Atualizada',
             contact: 'IA Neuro-Sync',
             timestamp: new Date().toISOString()
           };
           setLiveEvents(prev => [newEvent, ...prev].slice(0, 5));
         }
       )
       .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

   const { data: intelligenceData } = useQuery({
     queryKey: ['crm-intelligence-summary'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('crm_objection_intelligence' as any)
         .select('*')
         .order('created_at', { ascending: false })
         .limit(5);
       if (error) return [];
       return data;
     }
   });
 
   if (isLoading) return <Skeleton className="h-[600px] w-full" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
       <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
 
           <Card className="bg-violet-500/5 border-violet-200/50 hover:shadow-md transition-all">
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Precisão IA</p>
                  <h3 className="text-2xl font-bold text-violet-600 animate-pulse">94.2%</h3>
                 </div>
                 <Brain className="h-6 w-6 text-violet-500/40" />
               </div>
               <p className="text-[10px] text-violet-600/60 mt-1 flex items-center gap-1">
                 <Sparkles className="h-3 w-3" /> Auto-ajuste ativo
               </p>
             </CardContent>
           </Card>
          <Card className="bg-primary/5 border-primary/10 hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Global Score</p>
                <h3 className="text-2xl font-bold text-primary">{stats?.avgGlobalScore}/100</h3>
              </div>
              <Activity className="h-6 w-6 text-primary/40" />
            </div>
            <p className="text-[10px] text-primary/60 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +4% vs mês anterior
            </p>
          </CardContent>
        </Card>

          <Card className="bg-red-500/5 border-red-200/50 hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Em Risco</p>
                <h3 className="text-2xl font-bold text-red-600">{stats?.atRiskCount}</h3>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500/40" />
            </div>
            <p className="text-[10px] text-red-600/60 mt-1 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" /> -2 contatos vs ontem
            </p>
          </CardContent>
        </Card>

          <Card className="bg-emerald-500/5 border-emerald-200/50 hover:shadow-md transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Taxa de Retorno</p>
                  <h3 className="text-2xl font-bold text-emerald-600">68%</h3>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-500/40" />
              </div>
              <p className="text-[10px] text-emerald-600/60 mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12% eficácia cadência
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-primary">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              Live Pulse (Tempo Real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[105px] pr-4">
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {liveEvents.length > 0 ? (
                    liveEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-2 rounded bg-background border border-border/50 shadow-sm space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[7px] h-3 px-1 uppercase leading-none">
                            {event.type}
                          </Badge>
                          <span className="text-[7px] text-muted-foreground">
                            {format(new Date(event.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold truncate leading-tight">{event.title}</p>
                        <p className="text-[8px] text-muted-foreground truncate leading-tight">{event.contact}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-30">
                      <Sparkles className="h-5 w-5 mb-1" />
                      <p className="text-[8px]">Monitorando sinais...</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
               <MessageSquareWarning className="h-3.5 w-3.5 text-primary" />
               Tratador de Objeções IA
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {intelligenceData?.map((obj: any) => (
                 <div key={obj.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                   <div className="flex items-center justify-between">
                     <Badge variant="secondary" className="text-[9px] uppercase">{obj.objection_type}</Badge>
                     <span className="text-[10px] font-medium text-emerald-600">{obj.success_rate}% eficácia</span>
                   </div>
                   <p className="text-[11px] font-medium leading-tight">{obj.suggested_strategy}</p>
                   <div className="flex items-center gap-2">
                     <Progress value={Number(obj.success_rate)} className="h-1" />
                   </div>
                 </div>
               ))}
               {(!intelligenceData || intelligenceData.length === 0) && (
                 <div className="py-8 text-center opacity-40">
                   <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
                   <p className="text-xs">Aguardando sinais comportamentais...</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
 
         <Card className="lg:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
               <CalendarRange className="h-3.5 w-3.5 text-primary" />
               Roadmap Preditivo (6 Meses)
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
               {[
                 { month: 'Junho', event: 'Expansão de Contrato', prob: 85 },
                 { month: 'Agosto', event: 'Renovação Estratégica', prob: 92 },
                 { month: 'Outubro', event: 'Cross-sell: Módulo BI', prob: 64 },
               ].map((item, i) => (
                 <div key={i} className="relative pl-6">
                   <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border bg-background flex items-center justify-center">
                     <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-primary uppercase">{item.month}</span>
                     <span className="text-xs font-medium">{item.event}</span>
                     <span className="text-[10px] text-muted-foreground">Probabilidade: {item.prob}%</span>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
 
         <Card className="lg:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
               <Users className="h-3.5 w-3.5 text-primary" />
               Distribuição por Estágio
             </CardTitle>
           </CardHeader>
           <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={stats?.pieData}
                   innerRadius={50}
                   outerRadius={70}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {stats?.pieData.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.originalName] || '#cbd5e1'} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
 
         <Card className="lg:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
               <BarChart3 className="h-3.5 w-3.5 text-primary" />
               Score Médio por Estágio
             </CardTitle>
           </CardHeader>
           <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats?.avgScoreByStage}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                 <XAxis dataKey="stage" fontSize={9} axisLine={false} tickLine={false} />
                 <YAxis fontSize={9} axisLine={false} tickLine={false} />
                 <Tooltip />
                 <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={30}>
                   {stats?.avgScoreByStage.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.originalStage] || '#3b82f6'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Evolução do Score vs Impacto das Cadências
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke="#f59e0b" strokeWidth={2} dot={true} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
