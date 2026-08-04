import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, CheckCircle2, Star, Users, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTriggerAnalyticsData } from './trigger-analytics/useTriggerAnalyticsData';
import { TriggerAnalyticsTabs } from './trigger-analytics/TriggerAnalyticsTabs';

export function TriggerAnalytics({ className }: { className?: string }) {
  const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | '365d' | 'all'>('90d');
  const [activeTab, setActiveTab] = useState('overview');
  const { loading, stats, usageData, discChartData, resultPieData, radarData } = useTriggerAnalyticsData(periodFilter);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1, 2].map(i => <Skeleton key={i} className="h-80" />)}</div>
      </div>
    );
  }

  if (!stats || usageData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sem dados de gatilhos ainda</h3>
          <p className="text-muted-foreground text-sm">Use gatilhos mentais nos seus contatos para ver as estatísticas aqui.</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    { icon: Target, label: 'Total de usos', value: stats.totalUsages, color: 'bg-primary/10', iconColor: 'text-primary' },
    { icon: CheckCircle2, label: 'Taxa de sucesso', value: `${stats.successRate.toFixed(1)}%`, color: 'bg-success/10', iconColor: 'text-success' },
    { icon: Star, label: 'Nota média (1-5)', value: stats.avgRating.toFixed(1), color: 'bg-warning/10', iconColor: 'text-warning' },
    { icon: Users, label: 'Perfis DISC ativos', value: Object.values(stats.byDISC).filter(d => d.totalUsages > 0).length, color: 'bg-info/10', iconColor: 'text-info' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Analytics de Gatilhos por DISC</h2>
        </div>
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
          <SelectTrigger className="w-[160px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="365d">Último ano</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', card.color)}><card.icon className={cn('w-5 h-5', card.iconColor)} /></div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <TriggerAnalyticsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        discChartData={discChartData}
        resultPieData={resultPieData}
        radarData={radarData}
      />
    </div>
  );
}
