import { motion } from 'framer-motion';
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
import { CustomTooltip, PieTooltip, ComparisonBadge } from './charts/ChartComponents';

export type { PeriodFilter };

interface ChartProps { 
  period: PeriodFilter; 
  contacts?: any[];
  interactions?: any[];
}

export const ActivityChart = ({ period }: ChartProps) => {
  const activityData = getActivityData(period);
  const stats = getActivityStats(period);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Atividades por Período</CardTitle></div>
          <div className="flex flex-wrap gap-2 mt-2"><ComparisonBadge comparison={stats.emails} label="e-mails" /><ComparisonBadge comparison={stats.reunioes} label="reuniões" /><ComparisonBadge comparison={stats.ligacoes} label="ligações" /></div>
        </CardHeader>
        <CardContent>
          <AccessibleChart summary="Atividades por período — emails, reuniões e ligações" data={activityData.map(d => ({ label: d.name, value: `${d.emails}e / ${d.reunioes}r / ${d.ligacoes}l` }))} columns={['Período', 'E-mails / Reuniões / Ligações']}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>} />
                  <Bar dataKey="emails" name="E-mails" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reunioes" name="Reuniões" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ligacoes" name="Ligações" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
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
    <Card className="h-full">
      <CardHeader><CardTitle className="text-lg font-semibold flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-info" />Distribuição por Função</CardTitle></CardHeader>
      <CardContent>
        <AccessibleChart summary="Distribuição de contatos por função — Proprietário, Gerente, Comprador e Contato" data={contactsByRole.map(d => ({ label: d.name, value: d.value }))} columns={['Função', 'Quantidade']}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contactsByRole} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                  {contactsByRole.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
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

export const RelationshipScoreChart = ({ period }: ChartProps) => {
  const relationshipData = getRelationshipData(period);
  const totalCurrent = relationshipData.reduce((sum, item) => sum + item.value, 0);
  const totalPrevious = relationshipData.reduce((sum, item) => sum + item.prevValue, 0);
  const excellentComparison = calcChange(relationshipData[0].value, relationshipData[0].prevValue);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between"><CardTitle className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-warning" />Scores de Relacionamento</CardTitle></div>
          <div className="flex flex-wrap gap-2 mt-2"><ComparisonBadge comparison={excellentComparison} label="excelentes" /><ComparisonBadge comparison={calcChange(totalCurrent, totalPrevious)} label="total" /></div>
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
