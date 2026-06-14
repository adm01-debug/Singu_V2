import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  Timer,
  Zap,
  Target,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface RelationshipStatsPanelProps {
  className?: string;
  compact?: boolean;
}

// Mock data generation based on real metrics
const getRelationshipStats = () => {
  return {
    averageResponseTime: {
      value: '4.2h',
      change: -15,
      previous: '4.9h',
      trend: 'improving',
    },
    contactFrequency: {
      value: 3.8,
      change: 12,
      previous: 3.4,
      unit: 'contatos/semana',
    },
    scoreEvolution: {
      current: 72,
      previous: 68,
      change: 5.9,
      trend: [65, 67, 68, 70, 71, 72],
    },
    engagementRate: {
      value: 78,
      change: 8,
      previous: 72,
    },
    responseRate: {
      value: 92,
      change: 3,
      previous: 89,
    },
    activeContacts: {
      value: 45,
      total: 58,
      change: 5,
    },
    topChannels: [
      { name: 'Email', count: 45, percentage: 42 },
      { name: 'WhatsApp', count: 32, percentage: 30 },
      { name: 'Reunião', count: 18, percentage: 17 },
      { name: 'Ligação', count: 12, percentage: 11 },
    ],
    weeklyActivity: [
      { day: 'Seg', interactions: 8 },
      { day: 'Ter', interactions: 12 },
      { day: 'Qua', interactions: 6 },
      { day: 'Qui', interactions: 15 },
      { day: 'Sex', interactions: 9 },
      { day: 'Sáb', interactions: 2 },
      { day: 'Dom', interactions: 1 },
    ],
  };
};

const ChangeIndicator = ({ value, size = 'default' }: { value: number; size?: 'default' | 'sm' }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isPositive && 'text-success',
        isNeutral && 'text-muted-foreground',
        !isPositive && !isNeutral && 'text-destructive'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {Math.abs(value)}%
    </span>
  );
};

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, index) => (
        <div
          key={index}
          className={cn('w-1.5 rounded-t transition-all', color)}
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: '4px',
            opacity: 0.4 + (index / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
};

export const RelationshipStatsPanel = React.memo(function RelationshipStatsPanel({ className, compact = false }: RelationshipStatsPanelProps) {
  const stats = getRelationshipStats();
  
  const mainMetrics: StatMetric[] = [
    {
      label: 'Tempo Médio de Resposta',
      value: stats.averageResponseTime.value,
      change: stats.averageResponseTime.change,
      changeLabel: `vs ${stats.averageResponseTime.previous}`,
      icon: Timer,
      color: 'text-info',
      description: 'Reduzindo ↓',
    },
    {
      label: 'Frequência de Contato',
      value: `${stats.contactFrequency.value}`,
      change: stats.contactFrequency.change,
      changeLabel: stats.contactFrequency.unit,
      icon: MessageSquare,
      color: 'text-success',
      description: 'Interações por semana',
    },
    {
      label: 'Score Médio',
      value: `${stats.scoreEvolution.current}%`,
      change: stats.scoreEvolution.change,
      changeLabel: `vs ${stats.scoreEvolution.previous}%`,
      icon: Target,
      color: 'text-warning',
      description: 'Evolução positiva',
    },
    {
      label: 'Taxa de Engajamento',
      value: `${stats.engagementRate.value}%`,
      change: stats.engagementRate.change,
      changeLabel: `vs ${stats.engagementRate.previous}%`,
      icon: Zap,
      color: 'text-primary',
      description: 'Contatos engajados',
    },
  ];

  if (compact) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Estatísticas de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mainMetrics.slice(0, 3).map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-background', metric.color)}>
                  <metric.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="font-semibold text-foreground">{metric.value}</p>
                </div>
              </div>
              <ChangeIndicator value={metric.change || 0} size="sm" />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('space-y-6', className)}
    >
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2.5 rounded-xl bg-secondary/50', metric.color)}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <ChangeIndicator value={metric.change || 0} />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  {metric.changeLabel && (
                    <p className="text-xs text-muted-foreground/80">{metric.changeLabel}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response & Engagement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Performance de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Resposta</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.responseRate.value}%</span>
                  <ChangeIndicator value={stats.responseRate.change} size="sm" />
                </div>
              </div>
              <Progress value={stats.responseRate.value} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contatos Ativos</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.activeContacts.value}/{stats.activeContacts.total}</span>
                  <ChangeIndicator value={stats.activeContacts.change} size="sm" />
                </div>
              </div>
              <Progress 
                value={(stats.activeContacts.value / stats.activeContacts.total) * 100} 
                className="h-2" 
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evolução do Score</span>
                <MiniSparkline data={stats.scoreEvolution.trend} color="bg-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-success" />
              Canais de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topChannels.map((channel, index) => (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{channel.name}</span>
                  <span className="font-medium">{channel.count} ({channel.percentage}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${channel.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className={cn(
                      'h-full rounded-full',
                      index === 0 && 'bg-primary',
                      index === 1 && 'bg-success',
                      index === 2 && 'bg-warning',
                      index === 3 && 'bg-info'
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-warning" />
              Atividade Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-24 gap-1">
              {stats.weeklyActivity.map((day, index) => {
                const maxInteractions = Math.max(...stats.weeklyActivity.map(d => d.interactions));
                const height = (day.interactions / maxInteractions) * 100;
                
                return (
                  <motion.div
                    key={day.day}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-colors',
                        index === new Date().getDay() - 1 
                          ? 'bg-primary' 
                          : 'bg-primary/40 hover:bg-primary/60'
                      )}
                      style={{ height: '100%', minHeight: '4px' }}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {stats.weeklyActivity.map((day, index) => (
                <span 
                  key={day.day} 
                  className={cn(
                    'text-xs flex-1 text-center',
                    index === new Date().getDay() - 1 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground'
                  )}
                >
                  {day.day}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total da semana</span>
              <span className="font-semibold text-foreground">
                {stats.weeklyActivity.reduce((sum, d) => sum + d.interactions, 0)} interações
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
});
