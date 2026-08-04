import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDealVelocity } from '@/hooks/useDealVelocity';
import { cn } from '@/lib/utils';

interface DealVelocityPanelProps {
  compact?: boolean;
}

export function DealVelocityPanel({ compact = false }: DealVelocityPanelProps) {
  const { metrics, loading } = useDealVelocity();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Velocidade do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Gauge className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Dados insuficientes</p>
            <p className="text-sm">Adicione contatos para análise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return null;
    }
  };

  const getVelocityColor = (avgDays: number, benchmark: number) => {
    if (benchmark === 0) return 'text-muted-foreground';
    const ratio = avgDays / benchmark;
    if (ratio <= 0.8) return 'text-success';
    if (ratio <= 1.2) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className={cn(!compact && "col-span-full lg:col-span-2")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Velocidade do Pipeline
        </CardTitle>
        {!compact && (
          <Badge variant="outline" className="text-sm">
            {metrics.totalActiveDeals} deals ativos
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {metrics.averageCycleTime}
            </div>
            <div className="text-xs text-muted-foreground">
              dias em média
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 rounded-lg bg-secondary/50"
          >
            <Target className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold text-foreground">
              {metrics.projectedConversions}
            </div>
            <div className="text-xs text-muted-foreground">
              conversões projetadas
            </div>
          </motion.div>

          {metrics.bottleneckStage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-destructive" />
              <div className="text-sm font-bold text-destructive truncate">
                {metrics.stageVelocities.find(s => s.stage === metrics.bottleneckStage)?.stageName}
              </div>
              <div className="text-xs text-muted-foreground">
                gargalo atual
              </div>
            </motion.div>
          )}

          {metrics.fastestStage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 rounded-lg bg-success/10 border border-success/20"
            >
              <Zap className="h-5 w-5 mx-auto mb-2 text-success" />
              <div className="text-sm font-bold text-success truncate">
                {metrics.stageVelocities.find(s => s.stage === metrics.fastestStage)?.stageName}
              </div>
              <div className="text-xs text-muted-foreground">
                mais rápido
              </div>
            </motion.div>
          )}
        </div>

        {/* Stage Velocities */}
        {!compact && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Tempo por Estágio
            </h4>
            <div className="space-y-3">
              {metrics.stageVelocities
                .filter(s => s.stage !== 'churned')
                .map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-28 flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {stage.stageName}
                    </span>
                    {getTrendIcon(stage.trend)}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <Progress 
                      value={stage.benchmark > 0 
                        ? Math.min(100, (stage.averageDays / stage.benchmark) * 50)
                        : 0
                      } 
                      className="h-2"
                    />
                    <div className={cn(
                      "w-16 text-right text-sm font-medium",
                      getVelocityColor(stage.averageDays, stage.benchmark)
                    )}>
                      {stage.averageDays}d
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs w-20 justify-center">
                    {stage.contactCount} contatos
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Flow */}
        {!compact && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Fluxo do Pipeline
            </h4>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {metrics.stageVelocities
                .filter(s => s.stage !== 'churned')
                .map((stage, index, arr) => (
                <Fragment key={stage.stage}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg min-w-[100px]",
                      stage.stage === metrics.bottleneckStage && "bg-destructive/10",
                      stage.stage === metrics.fastestStage && "bg-success/10",
                      stage.stage !== metrics.bottleneckStage && 
                      stage.stage !== metrics.fastestStage && "bg-secondary/30"
                    )}
                  >
                    <div className="text-xl font-bold">{stage.contactCount}</div>
                    <div className="text-xs text-muted-foreground text-center">
                      {stage.stageName}
                    </div>
                    {stage.averageDays > 0 && (
                      <div className={cn(
                        "text-xs mt-1",
                        getVelocityColor(stage.averageDays, stage.benchmark)
                      )}>
                        ~{stage.averageDays}d
                      </div>
                    )}
                  </motion.div>
                  {index < arr.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-1" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trend */}
        {!compact && metrics.monthlyTrend.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Tendência Mensal (dias até conversão)
            </h4>
            <div className="flex items-end justify-between gap-2 h-20">
              {metrics.monthlyTrend.map((month, index) => {
                const maxVelocity = Math.max(...metrics.monthlyTrend.map(m => m.velocity));
                const height = maxVelocity > 0 
                  ? (month.velocity / maxVelocity) * 100 
                  : 0;
                
                return (
                  <motion.div
                    key={month.month}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div 
                      className={cn(
                        "w-full rounded-t",
                        month.velocity > 0 ? "bg-primary" : "bg-muted"
                      )}
                      style={{ minHeight: month.velocity > 0 ? '8px' : '4px', flex: 1 }}
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      {month.month}
                    </div>
                    {month.velocity > 0 && (
                      <div className="text-xs font-medium">
                        {month.velocity}d
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
