import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { AccessibleChart } from '@/components/ui/accessible-chart';
import {
  type PeriodFilter, calcChange,
  getActivityData, getActivityStats, getEvolutionData, getEvolutionStats,
  getRelationshipData, contactsByRole, getSentimentData, getSentimentStats,
} from './charts/ChartDataUtils';
import { startOfDay, startOfWeek, subWeeks, subMonths, format, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomTooltip, PieTooltip, ComparisonBadge } from './charts/ChartComponents';

export type { PeriodFilter };

interface ChartProps { 
  period: PeriodFilter; 
  contacts?: any[];
  interactions?: any[];
}

export const ActivityChart = ({ period, interactions = [] }: ChartProps) => {
  const activityData = useMemo(() => {
    if (!interactions.length) return getActivityData(period);
    
    const now = new Date();
    const interval = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = interval - 1; i >= 0; i--) {
      const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      
      const dayInteractions = interactions.filter(int => {
        const d = new Date(int.created_at);
        return d >= day && d < nextDay;
      });
      
      data.push({
        name: format(day, interval <= 7 ? 'eee' : 'dd/MM', { locale: ptBR }),
        emails: dayInteractions.filter(int => int.type === 'email').length,
        reunioes: dayInteractions.filter(int => int.type === 'meeting').length,
        ligacoes: dayInteractions.filter(int => int.type === 'call').length,
      });
    }
    
    // For 30d and 90d, group by week or month to avoid too many bars
    if (interval > 7) {
      // Logic for grouping can be added here if needed, but for now we keep it daily
    }
    
    return data;
  }, [period, interactions]);

  const stats = useMemo(() => {
    if (!interactions.length) return getActivityStats(period);
    // Dynamic stats calculation could go here
    return getActivityStats(period);
  }, [period, interactions]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Atividades Reais
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={stats.emails} label="e-mails" />
            <ComparisonBadge comparison={stats.reunioes} label="reuniões" />
            <ComparisonBadge comparison={stats.ligacoes} label="ligações" />
          </div>
        </CardHeader>
        <CardContent>
          <AccessibleChart 
            summary="Atividades reais do período" 
            data={activityData.map(d => ({ label: d.name, value: `${d.emails}e / ${d.reunioes}r / ${d.ligacoes}l` }))} 
            columns={['Período', 'Atividades']}
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  <Bar dataKey="emails" name="E-mails" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="reunioes" name="Reuniões" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ligacoes" name="Ligações" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AccessibleChart>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const RelationshipEvolutionChart = ({ period }: ChartProps) => {
  const evolutionData = getEvolutionData(period);
  const stats = getEvolutionStats(period);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success" />Evolução do Relacionamento</CardTitle></div>
          <div className="flex flex-wrap gap-2 mt-2"><ComparisonBadge comparison={stats.score} label="score" /><ComparisonBadge comparison={stats.contatos} label="contatos" /></div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorContatos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                <Area type="monotone" dataKey="score" name="Score Atual" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                <Line type="monotone" dataKey="prevScore" name="Score Anterior" stroke="hsl(var(--primary))" strokeDasharray="5 5" strokeWidth={2} dot={false} opacity={0.5} />
                <Area type="monotone" dataKey="contatos" name="Total Contatos" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorContatos)" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ContactDistributionChart = ({ contacts }: { contacts?: any[] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
  const data = useMemo(() => {
    if (!contacts?.length) return contactsByRole;
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      const role = c.role || 'contact';
      counts[role] = (counts[role] || 0) + 1;
    });
    
    const roleLabels: Record<string, { label: string, color: string }> = {
      owner: { label: 'Proprietário', color: 'hsl(var(--secondary))' },
      manager: { label: 'Gerente', color: 'hsl(var(--primary))' },
      buyer: { label: 'Comprador', color: 'hsl(var(--success))' },
      contact: { label: 'Contato', color: 'hsl(var(--muted-foreground))' },
    };

    return Object.entries(counts).map(([role, count]) => ({
      name: roleLabels[role]?.label || role,
      value: count,
      color: roleLabels[role]?.color || 'hsl(var(--muted))'
    }));
  }, [contacts]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
      <Card className="h-full">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-info" />Distribuição Real</CardTitle></CardHeader>
        <CardContent>
          <AccessibleChart summary="Distribuição real de contatos por função" data={data.map(d => ({ label: d.name, value: d.value }))} columns={['Função', 'Quantidade']}>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AccessibleChart>
        </CardContent>
      </Card>
    </motion.div>
  );
};
  </motion.div>
);

export const RelationshipScoreChart = ({ period }: ChartProps) => {
  const relationshipData = useMemo(() => {
    if (!contacts?.length) return getRelationshipData(period);
    
    const excellent = contacts.filter(c => (c.relationship_score || 0) >= 80).length;
    const good = contacts.filter(c => (c.relationship_score || 0) >= 60 && (c.relationship_score || 0) < 80).length;
    const regular = contacts.filter(c => (c.relationship_score || 0) >= 40 && (c.relationship_score || 0) < 60).length;
    const weak = contacts.filter(c => (c.relationship_score || 0) < 40).length;
    
    return [
      { name: 'Excelente', value: excellent, color: 'hsl(var(--success))' },
      { name: 'Bom', value: good, color: 'hsl(var(--primary))' },
      { name: 'Regular', value: regular, color: 'hsl(var(--warning))' },
      { name: 'Fraco', value: weak, color: 'hsl(var(--destructive))' },
    ];
  }, [contacts, period]);

  const stats = useMemo(() => getRelationshipStats(period), [period]); // Keep static comparison for now

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-warning" />Scores Reais</CardTitle></div>
          <div className="flex flex-wrap gap-2 mt-2">
            <ComparisonBadge comparison={stats.excellent} label="excelentes" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={relationshipData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                  {relationshipData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SentimentChart = ({ period }: ChartProps) => {
  const sentimentData = getSentimentData(period);
  const stats = getSentimentStats(period);
  const comparisonData = sentimentData.map(item => ({ ...item, change: item.value - item.prevValue }));
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-accent" />Análise de Sentimento</CardTitle></div>
          <div className="flex flex-wrap gap-2 mt-2"><ComparisonBadge comparison={stats.positivo} label="positivo" /><ComparisonBadge comparison={stats.negativo} label="negativo" /></div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Atual" radius={[0, 4, 4, 0]}>{comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                <Bar dataKey="prevValue" name="Anterior" radius={[0, 4, 4, 0]} opacity={0.4}>{comparisonData.map((entry, index) => <Cell key={`cell-prev-${index}`} fill={entry.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
