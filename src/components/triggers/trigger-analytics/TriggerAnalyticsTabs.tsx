import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend,
} from 'recharts';
import { Users, Target, Zap, Award, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS, TRIGGER_CATEGORIES } from '@/types/triggers';
import { DISC_COLORS, DISC_BG_COLORS, DISC_NAMES, type DISCProfile } from './types';
import type { TriggerEffectiveness } from './types';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number | string; dataKey?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>{' '}
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.dataKey?.includes('Rate') || entry.dataKey?.includes('rating') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface Props {
  activeTab: string;
  onTabChange: (v: string) => void;
  stats: {
    byDISC: Record<DISCProfile, { discProfile: DISCProfile; totalUsages: number; successRate: number; avgRating: number; topTriggers: Array<{ type: string; count: number; successRate: number; avgRating: number }> }>;
    triggerStats: TriggerEffectiveness[];
  };
  discChartData: Array<Record<string, unknown>>;
  resultPieData: Array<{ name: string; value: number; color: string }>;
  radarData: Array<Record<string, unknown>>;
}

export function TriggerAnalyticsTabs({ activeTab, onTabChange, stats, discChartData, resultPieData, radarData }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="disc">Por Perfil DISC</TabsTrigger>
        <TabsTrigger value="triggers">Por Gatilho</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Performance por Perfil DISC</CardTitle>
              <CardDescription>Taxa de sucesso e nota média por perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="successRate" name="Taxa Sucesso %" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="rating" name="Nota Média %" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" />Distribuição de Resultados</CardTitle>
              <CardDescription>Resultados dos gatilhos utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resultPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {resultPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4" />Efetividade dos Gatilhos por DISC</CardTitle>
              <CardDescription>Taxa de sucesso dos principais gatilhos em cada perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="trigger" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Dominante (D)" dataKey="D" stroke={DISC_COLORS.D} fill={DISC_COLORS.D} fillOpacity={0.2} />
                    <Radar name="Influente (I)" dataKey="I" stroke={DISC_COLORS.I} fill={DISC_COLORS.I} fillOpacity={0.2} />
                    <Radar name="Estável (S)" dataKey="S" stroke={DISC_COLORS.S} fill={DISC_COLORS.S} fillOpacity={0.2} />
                    <Radar name="Conforme (C)" dataKey="C" stroke={DISC_COLORS.C} fill={DISC_COLORS.C} fillOpacity={0.2} />
                    <Legend /><Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="disc" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(stats.byDISC).map((discStats) => (
            <Card key={discStats.discProfile}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Badge className={cn('text-base px-3 py-1', DISC_BG_COLORS[discStats.discProfile])}>{discStats.discProfile}</Badge>
                  <span className="text-base">{DISC_NAMES[discStats.discProfile]}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold">{discStats.totalUsages}</p><p className="text-xs text-muted-foreground">Usos</p></div>
                  <div><p className="text-2xl font-bold text-success">{discStats.successRate.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Sucesso</p></div>
                  <div><p className="text-2xl font-bold text-warning">{(discStats.avgRating / 20).toFixed(1)}</p><p className="text-xs text-muted-foreground">Nota</p></div>
                </div>
                {discStats.topTriggers.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Gatilhos mais usados:</p>
                    <div className="space-y-2">
                      {discStats.topTriggers.map((t) => {
                        const trigger = MENTAL_TRIGGERS[t.type as keyof typeof MENTAL_TRIGGERS];
                        return (
                          <div key={t.type} className="flex items-center gap-2">
                            <span className="text-lg">{trigger?.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{trigger?.name || t.type}</p>
                              <Progress value={t.successRate} className="h-1.5" />
                            </div>
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">{t.count}x</p>
                              <p className="text-success">{t.successRate.toFixed(0)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum gatilho usado com este perfil ainda.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="triggers" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" />Ranking de Gatilhos por Efetividade</CardTitle>
            <CardDescription>Gatilhos ordenados por taxa de sucesso e nota média</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {stats.triggerStats.map((triggerStat, index) => {
                  const trigger = MENTAL_TRIGGERS[triggerStat.triggerType];
                  const categoryInfo = trigger ? TRIGGER_CATEGORIES[trigger.category] : null;
                  return (
                    <motion.div key={triggerStat.triggerType} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{index + 1}</div>
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', trigger?.color)}>{trigger?.icon || '🎯'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{trigger?.name || triggerStat.triggerType}</h4>
                          {categoryInfo && <Badge variant="outline" className="text-xs">{categoryInfo.icon} {categoryInfo.name}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {(['D', 'I', 'S', 'C'] as const).map((disc) => {
                            const discData = triggerStat.byDISC[disc];
                            if (discData.usages === 0) return null;
                            return <Badge key={disc} variant="secondary" className={cn('text-xs', DISC_BG_COLORS[disc])}>{disc}: {discData.successRate.toFixed(0)}%</Badge>;
                          })}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm"><span className="text-muted-foreground">Usos:</span> <span className="font-semibold">{triggerStat.totalUsages}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">Sucesso:</span> <span className="font-semibold text-success">{triggerStat.successRate.toFixed(0)}%</span></p>
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span className="text-sm font-semibold">{(triggerStat.avgRating / 20).toFixed(1)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
