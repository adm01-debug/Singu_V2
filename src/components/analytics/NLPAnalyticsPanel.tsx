import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, AreaChart, Area,
} from 'recharts';
import {
  Brain, Heart, Eye, Ear, Hand, Lightbulb, AlertTriangle,
  Users, Sparkles, Activity, Calendar, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useNLPAnalyticsData, type PeriodFilter } from '@/hooks/useNLPAnalyticsData';
import { periodOptions, emotionColors, vakColors, discColors, CHART_COLORS } from '@/data/nlpAnalyticsConstants';

// ─── Shared Tooltip ────────────────────────────────────────────
interface TooltipPayloadItem { color: string; name: string; value: number | string }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-soft">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm text-muted-foreground">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, iconClass, label, value, delay }: {
  icon: typeof Brain; iconClass: string; label: string; value: number; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${iconClass}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────
export function NLPAnalyticsPanel() {
  const { stats, loading, period, setPeriod, refresh } = useNLPAnalyticsData();

  const vakChartData = useMemo(() => [
    { name: 'Visual', value: stats.vakDistribution.visual, icon: Eye },
    { name: 'Auditivo', value: stats.vakDistribution.auditory, icon: Ear },
    { name: 'Cinestésico', value: stats.vakDistribution.kinesthetic, icon: Hand },
    { name: 'Digital', value: stats.vakDistribution.digital, icon: Lightbulb },
  ], [stats.vakDistribution]);

  const discChartData = useMemo(() => [
    { name: 'Dominância', value: stats.discDistribution.D, profile: 'D' },
    { name: 'Influência', value: stats.discDistribution.I, profile: 'I' },
    { name: 'Estabilidade', value: stats.discDistribution.S, profile: 'S' },
    { name: 'Conformidade', value: stats.discDistribution.C, profile: 'C' },
  ], [stats.discDistribution]);

  const radarData = useMemo(() => {
    const max = Math.max(...Object.values(stats.vakDistribution), 1);
    return [
      { subject: 'Visual', value: Math.round((stats.vakDistribution.visual / max) * 100) },
      { subject: 'Auditivo', value: Math.round((stats.vakDistribution.auditory / max) * 100) },
      { subject: 'Cinestésico', value: Math.round((stats.vakDistribution.kinesthetic / max) * 100) },
      { subject: 'Digital', value: Math.round((stats.vakDistribution.digital / max) * 100) },
    ];
  }, [stats.vakDistribution]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={v => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Brain} iconClass="bg-primary/10 text-primary" label="Análises PNL" value={stats.totalAnalyses} delay={0.1} />
        <StatCard icon={Heart} iconClass="bg-primary/10 text-primary" label="Estados Emocionais" value={stats.emotionalStates.length} delay={0.2} />
        <StatCard icon={Sparkles} iconClass="bg-success/10 text-success" label="Valores Únicos" value={stats.topValues.length} delay={0.3} />
        <StatCard icon={AlertTriangle} iconClass="bg-warning/10 text-warning" label="Objeções Detectadas" value={stats.objectionTypes.reduce((a, b) => a + b.count, 0)} delay={0.4} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emotions">Emoções</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Tendência Emocional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.emotionalTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="positive" name="Positivo" stackId="1" stroke={CHART_COLORS.positive} fill={CHART_COLORS.positive} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="neutral" name="Neutro" stackId="1" stroke={CHART_COLORS.neutral} fill={CHART_COLORS.neutral} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="negative" name="Negativo" stackId="1" stroke={CHART_COLORS.negative} fill={CHART_COLORS.negative} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Distribuição VAK</CardTitle>
                <CardDescription>Perfis sensoriais agregados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border/50" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar name="VAK Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Distribuição DISC</CardTitle>
                <CardDescription>Perfis comportamentais dos contatos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={discChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                        {discChartData.map(e => <Cell key={e.profile} fill={discColors[e.profile as keyof typeof discColors]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Principais Valores Detectados</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topValues.length > 0 ? stats.topValues.slice(0, 6).map((v, i) => (
                    <div key={v.name} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-6 text-muted-foreground">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{v.name}</span>
                          <span className="text-xs text-muted-foreground">{v.count} ocorrências</span>
                        </div>
                        <Progress value={v.avgImportance * 10} className="h-2" />
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum valor detectado ainda</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotions */}
        <TabsContent value="emotions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Estados Emocionais por Frequência</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.emotionalStates} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" />
                      <YAxis dataKey="state" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Ocorrências" radius={[0, 4, 4, 0]}>
                        {stats.emotionalStates.map(e => <Cell key={e.state} fill={emotionColors[e.state] || 'hsl(var(--primary))'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Detalhes dos Estados</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.emotionalStates.length > 0 ? stats.emotionalStates.map(em => (
                    <div key={em.state} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotionColors[em.state] || 'hsl(var(--primary))' }} />
                        <span className="font-medium">{em.state}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{em.count} vezes</span>
                        <Badge variant="outline">{em.avgConfidence}% confiança</Badge>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-8">Nenhum estado emocional registrado</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profiles */}
        <TabsContent value="profiles" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Análise VAK Detalhada</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {vakChartData.map(item => {
                    const Icon = item.icon;
                    const ck = item.name.toLowerCase() === 'cinestésico' ? 'kinesthetic' : item.name.toLowerCase() === 'auditivo' ? 'auditory' : item.name.toLowerCase() as keyof typeof vakColors;
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{item.name}</span></div>
                          <span className="text-sm font-bold">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-3" style={{ '--progress-background': vakColors[ck] } as React.CSSProperties} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Análise DISC Detalhada</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {discChartData.map(item => (
                    <div key={item.profile} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: discColors[item.profile as keyof typeof discColors], color: 'white' }}>{item.profile}</Badge>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value} contatos</span>
                      </div>
                      <Progress value={(item.value / Math.max(...discChartData.map(d => d.value), 1)) * 100} className="h-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Values */}
        <TabsContent value="values" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Valores dos Clientes</CardTitle>
                <CardDescription>Valores mais frequentes detectados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topValues}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Ocorrências" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" /> Objeções por Tipo</CardTitle>
                <CardDescription>Taxa de resolução por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.objectionTypes.length > 0 ? stats.objectionTypes.map(obj => {
                    const rate = obj.count > 0 ? Math.round((obj.resolved / obj.count) * 100) : 0;
                    return (
                      <div key={obj.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{obj.type.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{obj.count} total</span>
                            <Badge variant={rate >= 70 ? 'default' : rate >= 40 ? 'secondary' : 'destructive'}>{rate}% resolvidas</Badge>
                          </div>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    );
                  }) : <p className="text-sm text-muted-foreground text-center py-8">Nenhuma objeção registrada</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
