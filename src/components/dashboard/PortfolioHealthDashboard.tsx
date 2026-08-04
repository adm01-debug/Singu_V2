import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Clock,
  Smile,
  Target,
  ChevronRight,
  Bell
} from 'lucide-react';
import { usePortfolioHealth, ClientHealthSummary } from '@/hooks/usePortfolioHealth';
import { Contact, Interaction } from '@/types';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface PortfolioHealthDashboardProps {
  contacts: Contact[];
  interactions: Interaction[];
  compact?: boolean;
}

const statusColors = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444'
};

const statusLabels = {
  healthy: 'Saudável',
  warning: 'Atenção',
  critical: 'Crítico'
};

const TrendIcon = forwardRef<HTMLSpanElement, { trend: 'up' | 'down' | 'stable' }>(({ trend }, ref) => {
  if (trend === 'up') return <span ref={ref}><TrendingUp className="h-3 w-3 text-success" /></span>;
  if (trend === 'down') return <span ref={ref}><TrendingDown className="h-3 w-3 text-destructive" /></span>;
  return <span ref={ref}><Minus className="h-3 w-3 text-muted-foreground" /></span>;
});
TrendIcon.displayName = 'TrendIcon';

const ClientRow = forwardRef<HTMLAnchorElement, { client: ClientHealthSummary }>(({ client }, _ref) => {
  return (
    <Link to={`/contatos/${client.contactId}`}>
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
        <div 
          className="w-2 h-8 rounded-full" 
          style={{ backgroundColor: statusColors[client.status] }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {client.contactName}
            </span>
            <TrendIcon trend={client.trend} />
          </div>
          <span className="text-xs text-muted-foreground truncate block">
            {client.companyName}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">{client.healthScore}%</div>
          {client.mainIssue && (
            <span className="text-xs text-destructive">{client.mainIssue}</span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
});
ClientRow.displayName = 'ClientRow';

export function PortfolioHealthDashboard({ contacts, interactions, compact = false }: PortfolioHealthDashboardProps) {
  const metrics = usePortfolioHealth(contacts, interactions);

  const distributionData = [
    { name: 'Saudável', value: metrics.healthDistribution.healthy, color: statusColors.healthy },
    { name: 'Atenção', value: metrics.healthDistribution.warning, color: statusColors.warning },
    { name: 'Crítico', value: metrics.healthDistribution.critical, color: statusColors.critical }
  ].filter(d => d.value > 0);

  const churnData = [
    { name: 'Baixo', value: metrics.churnRisk.low, color: '#22c55e' },
    { name: 'Médio', value: metrics.churnRisk.medium, color: '#f59e0b' },
    { name: 'Alto', value: metrics.churnRisk.high, color: '#f97316' },
    { name: 'Crítico', value: metrics.churnRisk.critical, color: '#ef4444' }
  ];

  if (compact) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-primary" />
                Saúde do Portfólio
              </CardTitle>
              <Badge 
                variant={metrics.overallStatus === 'healthy' ? 'default' : metrics.overallStatus === 'warning' ? 'secondary' : 'destructive'}
              >
                {metrics.overallScore}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={metrics.overallScore} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-success/10">
                <div className="font-bold text-success">{metrics.healthDistribution.healthy}</div>
                <div className="text-muted-foreground">Saudáveis</div>
              </div>
              <div className="p-2 rounded bg-warning/10">
                <div className="font-bold text-warning">{metrics.healthDistribution.warning}</div>
                <div className="text-muted-foreground">Atenção</div>
              </div>
              <div className="p-2 rounded bg-destructive/10">
                <div className="font-bold text-destructive">{metrics.healthDistribution.critical}</div>
                <div className="text-muted-foreground">Críticos</div>
              </div>
            </div>
            {metrics.alerts.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                <Bell className="h-3 w-3" />
                {metrics.alerts[0].title}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Main Health Score */}
      <Card className="border-2 overflow-hidden">
        <div className={`h-1 ${metrics.overallStatus === 'healthy' ? 'bg-success' : metrics.overallStatus === 'warning' ? 'bg-warning' : 'bg-destructive'}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Saúde Global do Portfólio
            </CardTitle>
            <Badge 
              className={`text-lg px-3 py-1 ${
                metrics.overallStatus === 'healthy' ? 'bg-success text-success-foreground' : 
                metrics.overallStatus === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'
              }`}
            >
              {metrics.overallScore}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="text-xl font-bold">{metrics.totalClients}</div>
              <div className="text-xs text-muted-foreground">Total de Clientes</div>
            </div>
            <div className="p-3 rounded-lg bg-success/10 text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-success" />
              <div className="text-xl font-bold text-success">{metrics.healthDistribution.healthy}</div>
              <div className="text-xs text-muted-foreground">Saudáveis</div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-warning" />
              <div className="text-xl font-bold text-warning">{metrics.atRiskClients}</div>
              <div className="text-xs text-muted-foreground">Em Atenção</div>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <Target className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <div className="text-xl font-bold text-destructive">{metrics.criticalClients}</div>
              <div className="text-xs text-muted-foreground">Críticos</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Health Distribution Pie */}
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium mb-3">Distribuição de Saúde</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Churn Risk Bar */}
            <div className="p-4 rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium mb-3">Risco de Churn</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={4}>
                      {churnData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Average Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.averageMetrics.lastContactDays}d</div>
              <div className="text-xs text-muted-foreground">Média Último Contato</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.averageMetrics.interactionsPerMonth}</div>
              <div className="text-xs text-muted-foreground">Interações/Mês</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.averageMetrics.relationshipScore}%</div>
              <div className="text-xs text-muted-foreground">Score Médio</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <Smile className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics.averageMetrics.positiveRate}%</div>
              <div className="text-xs text-muted-foreground">Taxa Positiva</div>
            </div>
          </div>

          {/* Trends */}
          <div className="flex items-center justify-center gap-6 p-3 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm"><strong>{metrics.trends.improving}</strong> melhorando</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm"><strong>{metrics.trends.stable}</strong> estáveis</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm"><strong>{metrics.trends.declining}</strong> em declínio</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Bell className="h-4 w-4" />
              Alertas do Portfólio ({metrics.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${
                  alert.severity === 'high' ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{alert.title}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.affectedCount} cliente(s)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Client Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Needs Attention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[280px]">
              <div className="space-y-1 pr-2">
                {metrics.needsAttention.length > 0 ? (
                  metrics.needsAttention.map(client => (
                    <ClientRow key={client.contactId} client={client} />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum cliente precisa de atenção urgente 🎉
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" />
              Melhores Relacionamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[280px]">
              <div className="space-y-1 pr-2">
                {metrics.topPerformers.map(client => (
                  <ClientRow key={client.contactId} client={client} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {metrics.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
