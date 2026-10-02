import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity, TrendingUp, TrendingDown, Clock, MessageSquare, Users,
  Building2, CheckCircle2, AlertCircle, Smile, Meh, Frown, Zap, Calendar,
} from 'lucide-react';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

const CHANNEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const channelLabels: Record<string, string> = {
  call: 'Ligação', email: 'E-mail', whatsapp: 'WhatsApp', meeting: 'Reunião',
  linkedin: 'LinkedIn', sms: 'SMS', other: 'Outro', note: 'Nota',
};

export default function Performance() {
  const m = usePerformanceMetrics();

  if (m.loading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const weekTrend = m.weekOverWeekChange;
  const TrendIcon = weekTrend >= 0 ? TrendingUp : TrendingDown;
  const trendColor = weekTrend > 0 ? 'text-emerald-500' : weekTrend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <AppLayout>
      <Helmet>
        <title>Performance | SINGU</title>
        <meta name="description" content="Dashboard de performance individual com métricas de atividade e engajamento." />
      </Helmet>

      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minha Performance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Métricas pessoais de atividade e resultados</p>
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="h-3 w-3" /> Tempo Real
          </Badge>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={MessageSquare} label="Interações Hoje" value={m.interactionsToday} accent="primary" />
          <KpiCard icon={Activity} label="Semana" value={m.interactionsThisWeek} suffix={
            <span className={`text-xs flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" /> {weekTrend > 0 ? '+' : ''}{weekTrend}%
            </span>
          } accent="primary" />
          <KpiCard icon={Calendar} label="Mês" value={m.interactionsThisMonth} accent="primary" />
          <KpiCard icon={Zap} label="Média/Dia" value={m.avgInteractionsPerDay} accent="primary" />

          <KpiCard icon={Users} label="Contatos" value={m.totalContacts} sub={`+${m.contactsThisMonth} este mês`} accent="success" />
          <KpiCard icon={Building2} label="Empresas" value={m.totalCompanies} sub={`+${m.companiesThisMonth} este mês`} accent="success" />
          <KpiCard icon={Clock} label="Tempo Resposta" value={m.avgResponseTime !== null ? `${m.avgResponseTime}min` : '—'} accent="warning" />
          <KpiCard icon={CheckCircle2} label="Follow-ups" value={`${m.followUpCompletionRate}%`} sub={`${m.pendingFollowUps} pendentes`} accent="warning" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atividade (30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.dailyActivity}>
                    <defs>
                      <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelFormatter={v => `Data: ${v}`}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#perfFill)" strokeWidth={2} name="Interações" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Channel breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Canais</CardTitle>
            </CardHeader>
            <CardContent>
              {m.channelBreakdown.length > 0 ? (
                <>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={m.channelBreakdown} dataKey="count" nameKey="channel" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                          {m.channelBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number, name: string) => [v, channelLabels[name] || name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {m.channelBreakdown.slice(0, 5).map((ch, i) => (
                      <div key={ch.channel} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                          {channelLabels[ch.channel] || ch.channel}
                        </span>
                        <span className="font-medium">{ch.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma interação registrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sentiment & engagement row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sentiment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sentimento das Interações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SentimentRow icon={Smile} label="Positivo" pct={m.positiveSentimentPct} color="bg-emerald-500" />
              <SentimentRow icon={Meh} label="Neutro" pct={m.neutralSentimentPct} color="bg-amber-500" />
              <SentimentRow icon={Frown} label="Negativo" pct={m.negativeSentimentPct} color="bg-destructive" />
            </CardContent>
          </Card>

          {/* Engagement summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resumo de Engajamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Dias ativos (30d)</span>
                <span className="font-bold text-lg">{m.activeDays}<span className="text-muted-foreground text-xs">/30</span></span>
              </div>
              <Progress value={(m.activeDays / 30) * 100} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm">Total de interações</span>
                <span className="font-bold text-lg">{m.totalInteractions}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Follow-ups pendentes</span>
                <div className="flex items-center gap-1.5">
                  {m.pendingFollowUps > 0 && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                  <span className="font-bold text-lg">{m.pendingFollowUps}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Sub-components ──

function KpiCard({ icon: Icon, label, value, sub, suffix, accent }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; suffix?: React.ReactNode; accent: 'primary' | 'success' | 'warning';
}) {
  const accentMap = {
    primary: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
  };
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
          <Icon className={`h-3.5 w-3.5 ${accentMap[accent]}`} />
          <span className="text-[11px] font-medium truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-xl font-bold">{value}</p>
          {suffix}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SentimentRow({ icon: Icon, label, pct, color }: {
  icon: React.ElementType; label: string; pct: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span>{label}</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
