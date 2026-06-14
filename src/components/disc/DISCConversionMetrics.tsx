// ==============================================
// DISC Conversion Metrics - Sales Performance by Profile
// Enterprise Level Component
// ==============================================

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  Target, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { useDISCConversionData, type ConversionPeriod } from '@/hooks/useDISCConversionData';
import { useState } from 'react';

const DISC_COLORS: Record<string, string> = {
  D: 'hsl(0, 70%, 50%)',
  I: 'hsl(45, 85%, 50%)',
  S: 'hsl(145, 60%, 45%)',
  C: 'hsl(210, 70%, 50%)'
};

const DISCConversionMetrics: React.FC = () => {
  const [period, setPeriod] = useState<ConversionPeriod>('90d');
  const { metrics, loading, bestProfile } = useDISCConversionData(period);

  const chartData = useMemo(() =>
    metrics.map(m => ({
      name: DISC_PROFILES[m.profile]?.name || m.profile,
      profile: m.profile,
      'Taxa de Conversão': m.conversionRate,
      'Score Médio': m.avgRelationshipScore,
      'Ciclo (dias)': m.avgCycleDays
    })),
  [metrics]);

  const radarData = useMemo(() => 
    metrics.map(m => ({
      profile: m.profile,
      conversao: m.conversionRate,
      relacionamento: m.avgRelationshipScore,
      velocidade: Math.max(0, 100 - m.avgCycleDays), // Inverse: faster = better
      volume: Math.min(100, m.totalContacts * 5)
    })),
  [metrics]);

  const pieData = useMemo(() => 
    metrics.map(m => ({
      name: m.profile,
      value: m.conversions,
      fill: DISC_COLORS[m.profile]
    })),
  [metrics]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };


  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Métricas de Conversão DISC</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as ConversionPeriod)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="180d">6 meses</SelectItem>
                <SelectItem value="365d">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => {
            const profileInfo = DISC_PROFILES[metric.profile];
            const isBest = metric.profile === bestProfile?.profile;

            return (
              <motion.div
                key={metric.profile}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border ${
                  isBest ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    style={{ 
                      backgroundColor: profileInfo?.color?.bg,
                      color: profileInfo?.color?.text
                    }}
                  >
                    {metric.profile}
                  </Badge>
                  {isBest && <Award className="w-4 h-4 text-warning" />}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.conversionRate}%
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {getTrendIcon(metric.trend)}
                  <span>{metric.conversions}/{metric.opportunities} conv.</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bar Chart */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3">Taxa de Conversão por Perfil</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="profile" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Bar 
                    dataKey="Taxa de Conversão" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.profile} fill={DISC_COLORS[entry.profile]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3">Distribuição de Conversões</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium mb-3">Métricas Detalhadas</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Perfil</th>
                  <th className="text-right py-2 px-2">Contatos</th>
                  <th className="text-right py-2 px-2">Conversão</th>
                  <th className="text-right py-2 px-2">Ticket Médio</th>
                  <th className="text-right py-2 px-2">Ciclo (dias)</th>
                  <th className="text-right py-2 px-2">Score Médio</th>
                  <th className="text-center py-2 px-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(metric => {
                  const profileInfo = DISC_PROFILES[metric.profile];
                  return (
                    <tr key={metric.profile} className="border-b border-border/50">
                      <td className="py-2 px-2">
                        <Badge 
                          style={{ 
                            backgroundColor: profileInfo?.color?.bg,
                            color: profileInfo?.color?.text
                          }}
                        >
                          {profileInfo?.name || metric.profile}
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-2 font-mono">
                        {metric.totalContacts}
                      </td>
                      <td className="text-right py-2 px-2 font-mono font-medium">
                        {metric.conversionRate}%
                      </td>
                      <td className="text-right py-2 px-2 font-mono">
                        R$ {metric.avgDealValue.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-2 px-2 font-mono">
                        {metric.avgCycleDays}
                      </td>
                      <td className="text-right py-2 px-2 font-mono">
                        {metric.avgRelationshipScore}
                      </td>
                      <td className="text-center py-2 px-2">
                        {getTrendIcon(metric.trend)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        {bestProfile && (
          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Insight Principal
            </h4>
            <p className="text-sm">
              Perfis <strong>{DISC_PROFILES[bestProfile.profile]?.name}</strong> têm a maior 
              taxa de conversão ({bestProfile.conversionRate}%). Considere priorizar prospects 
              com esse perfil e aplicar as estratégias específicas de comunicação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DISCConversionMetrics;
