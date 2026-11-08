import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  ShoppingCart,
  MessageSquare,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBehaviorAlerts, AlertType, AlertSeverity } from '@/hooks/useBehaviorAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ALERT_ICONS: Record<AlertType, React.ComponentType<{ className?: string }>> = {
  sentiment_drop: TrendingDown,
  engagement_drop: TrendingDown,
  churn_risk: AlertTriangle,
  purchase_overdue: ShoppingCart,
  communication_gap: MessageSquare,
  relationship_score_drop: TrendingDown,
  positive_momentum: TrendingUp
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-destructive/80 text-destructive-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-success text-success-foreground'
};

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  critical: 'border-l-4 border-l-destructive',
  high: 'border-l-4 border-l-destructive/80',
  medium: 'border-l-4 border-l-warning',
  low: 'border-l-4 border-l-success'
};

interface BehaviorAlertsPanelProps {
  compact?: boolean;
}

export function BehaviorAlertsPanel({ compact = false }: BehaviorAlertsPanelProps) {
  const { 
    alerts, 
    stats, 
    loading, 
    detectNewAlerts, 
    dismissAlert, 
    markActionTaken,
    ALERT_TYPE_CONFIG 
  } = useBehaviorAlerts();
  
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');
  const [detecting, setDetecting] = useState(false);

  const handleDetectNew = async () => {
    setDetecting(true);
    try {
      await detectNewAlerts();
    } catch {
      toast.error('Não foi possível detectar novos alertas. Tente novamente.');
    } finally {
      setDetecting(false);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  const displayedAlerts = compact ? filteredAlerts.slice(0, 3) : filteredAlerts;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, compact ? 3 : 4].map(i => (
            <Skeleton key={`behavior-skeleton-${i}`} className="h-20 w-full" />
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
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Alertas Inteligentes
                {stats.critical > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {stats.critical} crítico{stats.critical > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Mudanças comportamentais detectadas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  {filter === 'all' ? 'Todos' : filter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Todos ({stats.total})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('critical')}>
                  Crítico ({stats.critical})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('high')}>
                  Alto ({stats.high})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('medium')}>
                  Médio ({stats.medium})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('low')}>
                  Baixo ({stats.low})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDetectNew}
              disabled={detecting}
              aria-label={detecting ? 'Detectando novos alertas' : 'Detectar novos alertas'}
              aria-busy={detecting}
            >
              <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats Bar */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {stats.critical > 0 && (
              <Badge variant="destructive" className="whitespace-nowrap">
                {stats.critical} Crítico
              </Badge>
            )}
            {stats.high > 0 && (
              <Badge className="bg-destructive/80 whitespace-nowrap">
                {stats.high} Alto
              </Badge>
            )}
            {stats.medium > 0 && (
              <Badge className="bg-warning whitespace-nowrap">
                {stats.medium} Médio
              </Badge>
            )}
            {stats.low > 0 && (
              <Badge className="bg-success whitespace-nowrap">
                {stats.low} Positivo
              </Badge>
            )}
          </div>

          {/* Alerts List */}
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum alerta {filter !== 'all' ? `de severidade "${filter}"` : ''}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={handleDetectNew}
                  className="mt-2"
                >
                  Verificar agora
                </Button>
              </motion.div>
            ) : (
              <div className={`space-y-3 ${compact ? '' : 'max-h-[400px]'} overflow-y-auto`}>
                {displayedAlerts.map((alert, idx) => {
                  const Icon = ALERT_ICONS[alert.type] || Bell;
                  const config = ALERT_TYPE_CONFIG[alert.type];
                  
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 border rounded-lg ${SEVERITY_BORDER[alert.severity]} hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            alert.type === 'positive_momentum' 
                              ? 'bg-success/10' 
                              : 'bg-warning/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              alert.type === 'positive_momentum' 
                                ? 'text-success' 
                                : 'text-warning'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link 
                                to={`/contatos/${alert.contactId}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {alert.contactName}
                              </Link>
                              <Badge className={`text-xs ${SEVERITY_COLORS[alert.severity]}`}>
                                {alert.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-sm font-medium mt-0.5">
                              {config?.icon} {alert.title}
                            </p>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(alert.detectedAt), { 
                                  locale: ptBR, 
                                  addSuffix: true 
                                })}
                              </span>
                              
                              {alert.changePercent !== undefined && (
                                <span className={
                                  alert.type === 'positive_momentum'
                                    ? 'text-success'
                                    : 'text-destructive'
                                }>
                                  {alert.type === 'positive_momentum' ? '+' : ''}
                                  {alert.changePercent}%
                                </span>
                              )}
                            </div>

                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <span className="font-medium">Ação recomendada:</span>{' '}
                              {alert.recommendedAction}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon" aria-label="Confirmar"
                            className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            onClick={() => markActionTaken(alert.id)}
                            title="Marcar como resolvido"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => dismissAlert(alert.id)}
                            aria-label="Dispensar"
                            title="Dispensar"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Link to={`/contatos/${alert.contactId}`}>
     <Button
                              variant="ghost"
                              size="icon" aria-label="Ver contato"
                              className="h-8 w-8"
                              title="Ver contato"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
