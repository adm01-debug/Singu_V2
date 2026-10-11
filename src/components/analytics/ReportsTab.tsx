import React, { lazy, Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Users, DollarSign, Target, AlertTriangle, Sun, Building2, Radio } from 'lucide-react';
import {
  useConversionFunnel,
  useParetoCustomers,
  useLossReasonAnalysis,
  useComparePeriods,
  useTrendAnalysis,
  useSeasonalityAnalysis,
  useIndustryAnalysis,
  useChannelAnalysis,
} from '@/hooks/useReportsAnalytics';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--info))', 'hsl(var(--muted-foreground))'];

const CohortAnalysisWidget = lazy(() => import('@/components/analytics/CohortAnalysisWidget'));
const YoyComparisonWidget = lazy(() => import('@/components/analytics/YoyComparisonWidget'));
const MonthlyReportWidget = lazy(() => import('@/components/analytics/MonthlyReportWidget'));

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  );
}

// ── Period Comparison Cards ────────────────────────

function PeriodComparisonCards() {
  const { data: revenue } = useComparePeriods('revenue', 30);
  const { data: deals } = useComparePeriods('deals', 30);
  const { data: interactions } = useComparePeriods('interactions', 30);

  const items = [
    { label: 'Receita', data: revenue, icon: DollarSign, format: 'currency' },
    { label: 'Deals', data: deals, icon: Target, format: 'number' },
    { label: 'Interações', data: interactions, icon: Users, format: 'number' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, data, icon: Icon, format }) => {
        if (!data) return <Skeleton key={label} className="h-24" />;
        const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
        const trendColor = data.trend === 'up' ? 'text-success' : data.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
        return (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Icon className="h-3.5 w-3.5" /> {label} (30d)
              </div>
              <p className="text-xl font-bold">
                {format === 'currency' ? formatCurrency(data.current) : data.current}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {data.change_percent > 0 ? '+' : ''}{data.change_percent?.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Conversion Funnel ──────────────────────────────

function ConversionFunnelChart() {
  const { data: funnel, isLoading } = useConversionFunnel(30);
  if (isLoading) return <Skeleton className="h-64" />;
  if (!funnel || funnel.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={funnel} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Loss Reasons ───────────────────────────────────

function LossReasonsChart() {
  const { data: reasons, isLoading } = useLossReasonAnalysis();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!reasons || reasons.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Motivos de Perda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={reasons} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={90} label={({ reason, percentage }) => `${reason} (${percentage?.toFixed(0)}%)`} labelLine={false}>
              {reasons.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Trend Analysis ─────────────────────────────────

function TrendChart() {
  const { data: trends, isLoading } = useTrendAnalysis(6);
  if (isLoading) return <Skeleton className="h-64" />;
  if (!trends || trends.length === 0) return null;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Tendência (6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Pareto Customers ───────────────────────────────

function ParetoList() {
  const { data: customers, isLoading } = useParetoCustomers();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!customers || customers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Top Clientes (Pareto 80/20)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {customers.slice(0, 15).map((c, i) => (
            <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-sm font-medium truncate max-w-[160px]">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{formatCurrency(c.revenue)}</span>
                <Badge variant="outline" className="text-[10px]">{c.cumulative_percent?.toFixed(0)}%</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Seasonality Chart ──────────────────────────────

function SeasonalityChart() {
  const { data: seasons, isLoading } = useSeasonalityAnalysis(12);
  if (isLoading) return <Skeleton className="h-64" />;
  if (!seasons || seasons.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sun className="h-4 w-4 text-warning" /> Sazonalidade por Mês do Ano (12 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={seasons}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month_name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Line yAxisId="left" type="monotone" dataKey="avg_revenue" name="Receita Média" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="avg_deals" name="Deals Médios" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Industry Analysis ─────────────────────────────

function IndustryChart() {
  const { data: industries, isLoading } = useIndustryAnalysis();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!industries || industries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Análise por Indústria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={industries.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis dataKey="industry" type="category" width={110} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="total_revenue" name="Receita Total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Channel Analysis ──────────────────────────────

function ChannelChart() {
  const { data: channels, isLoading } = useChannelAnalysis();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!channels || channels.length === 0) return null;

  const radarData = channels.map(c => ({
    channel: c.channel,
    'Tempo de Resposta Registrado': c.response_rate,
    'Empresas com Negócios Ganhos': c.conversion_rate,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Radio className="h-4 w-4 text-info" /> Efetividade por Canal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="channel" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis tick={{ fontSize: 9 }} />
            <Radar name="Tempo de Resposta Registrado" dataKey="Tempo de Resposta Registrado" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
            <Radar name="Empresas com Negócios Ganhos" dataKey="Empresas com Negócios Ganhos" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.2)" strokeWidth={2} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
          </RadarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground">Percentuais por canal. Sem tempos de resposta registrados, essa medida fica indisponível.</p>
      </CardContent>
    </Card>
  );
}

// ── Main Tab ───────────────────────────────────────

export default function ReportsTab() {
  return (
    <div className="space-y-6">
      <PeriodComparisonCards />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConversionFunnelChart />
        <LossReasonsChart />
      </div>
      <TrendChart />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SeasonalityChart />
        <IndustryChart />
      </div>
      <ChannelChart />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardErrorBoundary sectionName="Comparativo Anual">
          <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
            <YoyComparisonWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Relatório Mensal">
          <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
            <MonthlyReportWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>
      <DashboardErrorBoundary sectionName="Análise de Coorte">
        <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
          <CohortAnalysisWidget />
        </Suspense>
      </DashboardErrorBoundary>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParetoList />
      </div>
    </div>
  );
}
