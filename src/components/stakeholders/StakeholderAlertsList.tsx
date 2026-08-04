import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  X, 
  RefreshCw, 
  ExternalLink,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useStakeholderAlerts } from '@/hooks/useStakeholderAlerts';

interface StakeholderAlertsListProps {
  companyId?: string;
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

const ALERT_ICONS: Record<string, React.ReactNode> = {
  blocker_identified: <Shield className="h-4 w-4" />,
  champion_disengaging: <TrendingDown className="h-4 w-4" />,
  support_dropped: <TrendingDown className="h-4 w-4" />,
  risk_increased: <AlertTriangle className="h-4 w-4" />,
  quadrant_changed: <Target className="h-4 w-4" />,
  engagement_dropped: <Users className="h-4 w-4" />,
  new_champion: <Zap className="h-4 w-4" />,
  support_improved: <TrendingUp className="h-4 w-4" />
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/50',
    badge: 'bg-destructive text-destructive-foreground'
  },
  high: {
    bg: 'bg-accent/10',
    border: 'border-accent/50',
    badge: 'bg-warning text-warning-foreground'
  },
  medium: {
    bg: 'bg-warning/10',
    border: 'border-warning/50',
    badge: 'bg-warning text-foreground'
  },
  low: {
    bg: 'bg-primary/10',
    border: 'border-primary/50',
    badge: 'bg-primary text-primary-foreground'
  }
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo'
};

export function StakeholderAlertsList({
  companyId,
  maxItems = 5,
  showHeader = true,
  compact = false,
  className = ''
}: StakeholderAlertsListProps) {
  const navigate = useNavigate();
  const { alerts, loading, dismissAlert, dismissAllAlerts, refreshAlerts } = useStakeholderAlerts(companyId);

  const displayedAlerts = alerts.slice(0, maxItems);
  const hasMoreAlerts = alerts.length > maxItems;

  const getAlertStyles = (severity: string) => {
    return SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Alertas de Stakeholders
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <BellOff className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Nenhum alerta ativo</p>
            <p className="text-sm">Você será notificado quando houver mudanças significativas.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Alertas de Stakeholders
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshAlerts()}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {alerts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAllAlerts()}
                  className="text-xs"
                >
                  Dispensar todos
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-3' : ''}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedAlerts.map((alert) => {
              const styles = getAlertStyles(alert.severity);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-full ${styles.badge}`}>
                        {ALERT_ICONS[alert.alert_type] || <Bell className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm truncate">
                            {alert.title}
                          </h4>
                          <Badge className={`text-xs ${styles.badge}`}>
                            {SEVERITY_LABELS[alert.severity]}
                          </Badge>
                        </div>
                        {!compact && alert.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                        {!compact && alert.recommended_action && (
                          <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                            <span className="font-medium">Ação recomendada: </span>
                            {alert.recommended_action}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          {alert.company && (
                            <span>• {alert.company.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {alert.contact_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/contatos/${alert.contact_id}`)}
                          className="h-8 w-8 p-0"
                          title="Ver contato"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Dispensar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {hasMoreAlerts && (
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => navigate('/notificacoes')}
            >
              Ver mais {alerts.length - maxItems} alertas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
