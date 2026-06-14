import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Heart, AlertTriangle, Zap, Target, Lightbulb, Activity } from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import type { BrainSystem } from '@/types/neuromarketing';

interface Props {
  activeTab: string;
  onTabChange: (v: string) => void;
  brainDistribution: Record<BrainSystem, { count: number; contacts: string[] }>;
  brainPieData: Array<{ name: string; value: number; color: string; icon: string }>;
  strategyRadarData: Array<{ strategy: string; value: number; fullMark: number }>;
  decisionSpeedData: Array<{ name: string; value: number; color: string }>;
  portfolioStimuli: Array<{ stimulus: string; count: number; info: { icon: string; namePt: string; descriptionPt: string; applicationTips: string[] } }>;
  neurochemicalBarData: Array<{ name: string; count: number; icon: string }>;
  contacts: Array<unknown>;
  BRAIN_SYSTEM_INFO: Record<string, { namePt: string; icon: string; bgColor: string; decisionRole: string }>;
  NEUROCHEMICAL_INFO: Record<string, { namePt: string; icon: string; bgColor: string; effectPt: string; salesApplication: string }>;
  profileCoverage: number;
}

export function NeuroPortfolioTabs(props: Props) {
  const { activeTab, onTabChange, brainDistribution, brainPieData, strategyRadarData, decisionSpeedData, portfolioStimuli, neurochemicalBarData, contacts, BRAIN_SYSTEM_INFO, NEUROCHEMICAL_INFO, profileCoverage } = props;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="overview" className="text-xs"><Activity className="h-4 w-4 mr-1" />Visão Geral</TabsTrigger>
        <TabsTrigger value="brain" className="text-xs"><Brain className="h-4 w-4 mr-1" />3 Cérebros</TabsTrigger>
        <TabsTrigger value="stimuli" className="text-xs"><Zap className="h-4 w-4 mr-1" />Estímulos</TabsTrigger>
        <TabsTrigger value="chemistry" className="text-xs"><Heart className="h-4 w-4 mr-1" />Neuroquímica</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: AlertTriangle, label: 'Reptiliano', count: brainDistribution.reptilian.count, desc: 'Foco em segurança', cls: 'bg-destructive dark:bg-destructive/20 border border-destructive dark:border-destructive', iconCls: 'text-destructive', valCls: 'text-destructive' },
            { icon: Heart, label: 'Límbico', count: brainDistribution.limbic.count, desc: 'Foco emocional', cls: 'bg-primary dark:bg-primary/20 border border-primary/30', iconCls: 'text-primary', valCls: 'text-primary' },
            { icon: Brain, label: 'Neocórtex', count: brainDistribution.neocortex.count, desc: 'Foco analítico', cls: 'bg-info dark:bg-info/20 border border-info', iconCls: 'text-info', valCls: 'text-info' },
            { icon: Target, label: 'Cobertura', count: `${profileCoverage}%`, desc: 'Contatos perfilados', cls: 'bg-primary/10 border border-primary/20', iconCls: 'text-primary', valCls: 'text-primary' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`p-4 rounded-lg ${card.cls}`}>
              <div className="flex items-center gap-2 mb-2"><card.icon className={`h-5 w-5 ${card.iconCls}`} /><span className="text-sm font-medium">{card.label}</span></div>
              <p className={`text-2xl font-bold ${card.valCls}`}>{card.count}</p>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </motion.div>
          ))}
        </div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Estratégias Recomendadas para o Portfólio</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={strategyRadarData}><PolarGrid stroke="hsl(var(--border))" /><PolarAngleAxis dataKey="strategy" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} /><Radar name="Relevância" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} /><Legend /></RadarChart></ResponsiveContainer></div></CardContent></Card>
      </TabsContent>

      <TabsContent value="brain" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-base">Distribuição dos 3 Cérebros</CardTitle></CardHeader><CardContent><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={brainPieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">{brainPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /><Legend /></RechartsPie></ResponsiveContainer></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-base">Detalhes por Sistema</CardTitle></CardHeader><CardContent><ScrollArea className="h-[280px]"><div className="space-y-3">{(Object.entries(brainDistribution) as [BrainSystem, { count: number; contacts: string[] }][]).map(([system, data]) => (<div key={system} className={`p-3 rounded-lg ${BRAIN_SYSTEM_INFO[system].bgColor} border`}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-xl">{BRAIN_SYSTEM_INFO[system].icon}</span><span className="font-medium">{BRAIN_SYSTEM_INFO[system].namePt}</span></div><Badge variant="secondary">{data.count} contatos</Badge></div><p className="text-xs text-muted-foreground mb-2">{BRAIN_SYSTEM_INFO[system].decisionRole}</p>{data.contacts.length > 0 && <p className="text-xs truncate">Ex: {data.contacts.slice(0, 3).join(', ')}{data.contacts.length > 3 && ` +${data.contacts.length - 3}`}</p>}</div>))}</div></ScrollArea></CardContent></Card>
        </div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Velocidade de Decisão do Portfólio</CardTitle></CardHeader><CardContent><div className="flex items-center gap-4">{decisionSpeedData.map(item => <div key={item.name} className="flex-1 p-3 rounded-lg bg-muted/50 border text-center"><p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p><p className="text-sm text-muted-foreground">{item.name}</p></div>)}</div></CardContent></Card>
      </TabsContent>

      <TabsContent value="stimuli" className="space-y-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-5 w-5 text-warning" />6 Estímulos Primários - Ranking do Portfólio</CardTitle><CardDescription>Estímulos mais efetivos baseado em perfis DISC</CardDescription></CardHeader><CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolioStimuli.map((item, index) => (
              <motion.div key={item.stimulus} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className={`p-4 rounded-lg border transition-all ${index === 0 ? 'bg-primary/10 border-primary ring-2 ring-primary' : index === 1 ? 'bg-warning dark:bg-warning/20 border-warning' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{item.info.icon}</span><Badge variant={index === 0 ? 'default' : 'secondary'}>#{index + 1}</Badge></div>
                <h4 className="font-semibold">{item.info.namePt}</h4><p className="text-xs text-muted-foreground mt-1">{item.count} contatos respondem</p><Progress value={(item.count / (contacts.length || 1)) * 100} className="h-1.5 mt-2" />
              </motion.div>
            ))}
          </div>
          {portfolioStimuli[0] && <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20"><h4 className="font-medium mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Recomendação Principal</h4><p className="text-sm">Priorize comunicações com <strong>{portfolioStimuli[0].info.namePt}</strong> - {portfolioStimuli[0].info.descriptionPt}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs">{portfolioStimuli[0].info.applicationTips.slice(0, 2).map((tip, i) => <div key={i} className="flex items-center gap-1"><span className="text-primary">→</span> {tip}</div>)}</div></div>}
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="chemistry" className="space-y-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Perfil Neuroquímico do Portfólio</CardTitle><CardDescription>Neuroquímicos dominantes baseados nos perfis comportamentais</CardDescription></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={neurochemicalBarData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} /><YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={100} /><Tooltip content={({ active, payload }) => active && payload?.length ? <div className="bg-popover border rounded-lg p-2 shadow-soft"><p className="font-medium">{payload[0].payload.icon} {payload[0].payload.name}</p><p className="text-sm text-muted-foreground">{payload[0].value} contatos</p></div> : null} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {neurochemicalBarData.slice(0, 4).map((item, index) => {
            const chemKey = Object.entries(NEUROCHEMICAL_INFO).find(([_, info]) => info.namePt === item.name)?.[0] as string | undefined;
            if (!chemKey) return null;
            const info = NEUROCHEMICAL_INFO[chemKey];
            return (
              <motion.div key={item.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`p-4 rounded-lg border ${info.bgColor}`}>
                <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{info.icon}</span><div><h4 className="font-semibold">{info.namePt}</h4><p className="text-xs text-muted-foreground">{item.count} contatos</p></div></div>
                <p className="text-sm mb-2">{info.effectPt}</p><div className="text-xs p-2 bg-background/50 rounded"><span className="font-medium">Aplicação:</span> {info.salesApplication}</div>
              </motion.div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}
