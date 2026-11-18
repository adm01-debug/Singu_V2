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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useActivityOverview } from '@/hooks/useActivityOverview';
import { toEngagementByChannel, toWeekdayActivity, calcChange } from '@/data/analyticsData';
import { parseApiError } from '@/lib/errorMessages';

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
  // Janela de 30 dias e a mesma janela anterior, para as comparacoes.
  const atual = useActivityOverview('30d', 0);
  const anterior = useActivityOverview('30d', 1);

  const canais = toEngagementByChannel(atual.data);
  const totalCanais = canais.reduce((soma, c) => soma + c.sent + c.received, 0);
  const atividadeSemanal = toWeekdayActivity(atual.data);

  const interacoes = atual.data?.totais.interacoes ?? 0;
  const interacoesAntes = anterior.data?.totais.interacoes ?? 0;
  const alcancados = atual.data?.totais.contatos_alcancados ?? 0;
  const alcancadosAntes = anterior.data?.totais.contatos_alcancados ?? 0;
  const recebidas = atual.data?.totais.recebidas ?? 0;
  const recebidasAntes = anterior.data?.totais.recebidas ?? 0;

  const cmpInteracoes = calcChange(interacoes, interacoesAntes);
  const cmpAlcancados = calcChange(alcancados, alcancadosAntes);
  const cmpRecebidas = calcChange(recebidas, recebidasAntes);
  // Media semanal sobre a janela de 30 dias, arredondada a uma casa.
  const porSemana = Math.round((interacoes / 30) * 7 * 10) / 10;
  const porSemanaAntes = Math.round((interacoesAntes / 30) * 7 * 10) / 10;

  const mainMetrics: StatMetric[] = [
    {
      label: 'Interações (30 dias)',
      value: interacoes,
      change: cmpInteracoes.change,
      changeLabel: `vs ${interacoesAntes} nos 30 anteriores`,
      icon: MessageSquare,
      color: 'text-success',
    },
    {
      label: 'Frequência de Contato',
      value: porSemana,
      change: calcChange(porSemana, porSemanaAntes).change,
      changeLabel: 'interações por semana',
      icon: Timer,
      color: 'text-info',
    },
    {
      label: 'Contatos Alcançados',
      value: alcancados,
      change: cmpAlcancados.change,
      changeLabel: `vs ${alcancadosAntes} nos 30 anteriores`,
      icon: Target,
      color: 'text-warning',
    },
    {
      label: 'Recebidas',
      value: recebidas,
      change: cmpRecebidas.change,
      changeLabel: 'interações de entrada',
      icon: Zap,
      color: 'text-primary',
    },
  ];

  if (atual.isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (atual.error) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="p-6" role="alert">
          <p className="text-sm text-destructive">{parseApiError(atual.error)}</p>
        </CardContent>
      </Card>
    );
  }

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
                <span className="text-muted-foreground">Taxa de resposta</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {interacoes > 0 ? Math.round((recebidas / interacoes) * 100) : 0}%
                  </span>
                  <ChangeIndicator value={cmpRecebidas.change} size="sm" />
                </div>
              </div>
              <Progress value={interacoes > 0 ? (recebidas / interacoes) * 100 : 0} className="h-2" />
              <p className="text-[10px] text-muted-foreground">
                {recebidas} de entrada em {interacoes} interações no período
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contatos alcançados</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{alcancados}</span>
                  <ChangeIndicator value={cmpAlcancados.change} size="sm" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volume por período</span>
                <MiniSparkline data={(atual.data?.serie ?? []).map(p => p.interacoes)} color="bg-primary" />
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
            {canais.map((channel, index) => (
              <motion.div
                key={channel.channel}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{channel.channel}</span>
                  <span className="font-medium">{channel.sent + channel.received} ({totalCanais > 0 ? Math.round(((channel.sent + channel.received) / totalCanais) * 100) : 0}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalCanais > 0 ? Math.round(((channel.sent + channel.received) / totalCanais) * 100) : 0}%` }}
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
              {atividadeSemanal.map((day, index) => {
                const maxInteractions = Math.max(1, ...atividadeSemanal.map(d => d.interacoes));
                const height = (day.interacoes / maxInteractions) * 100;
                
                return (
                  <motion.div
                    key={day.dia}
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
              {atividadeSemanal.map((day, index) => (
                <span 
                  key={day.dia} 
                  className={cn(
                    'text-xs flex-1 text-center',
                    index === new Date().getDay() - 1 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground'
                  )}
                >
                  {day.dia}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total no período</span>
              <span className="font-semibold text-foreground">
                {atividadeSemanal.reduce((sum, d) => sum + d.interacoes, 0)} interações
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
});
