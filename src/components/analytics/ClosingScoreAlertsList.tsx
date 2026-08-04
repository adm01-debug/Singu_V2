import { motion, AnimatePresence } from 'framer-motion';
import { useClosingScoreAlerts } from '@/hooks/useClosingScoreAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  X, 
  ExternalLink,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ClosingScoreAlertsListProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function ClosingScoreAlertsList({ 
  className, 
  maxItems = 5,
  showHeader = true,
  compact = false
}: ClosingScoreAlertsListProps) {
  const { alerts, loading, dismissAlert, dismissAllAlerts, refreshAlerts } = useClosingScoreAlerts();
  const navigate = useNavigate();

  const displayedAlerts = alerts.slice(0, maxItems);

  const getAlertStyles = (changeType: string) => {
    if (changeType === 'improved_to_high') {
      return {
        bg: 'bg-success/10 border-success/30',
        icon: TrendingUp,
        iconColor: 'text-success',
        badgeBg: 'bg-success/20 text-success border-success/30'
      };
    }
    return {
      bg: 'bg-destructive/10 border-destructive/30',
      icon: TrendingDown,
      iconColor: 'text-destructive',
      badgeBg: 'bg-destructive/20 text-destructive border-destructive/30'
    };
  };

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (displayedAlerts.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Alertas de Score de Fechamento
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <BellOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhum alerta de mudança significativa
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Você será notificado quando scores mudarem para Alta ou Muito Baixa
            </p>
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
              <Bell className="h-5 w-5 text-primary animate-pulse" />
              Alertas de Score de Fechamento
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAlerts}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {alerts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAllAlerts}
                  className="text-xs"
                >
                  Dispensar todos
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("space-y-3", compact && "p-3")}>
        <AnimatePresence mode="popLayout">
          {displayedAlerts.map((alert, index) => {
            const styles = getAlertStyles(alert.change_type);
            const Icon = styles.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative p-4 rounded-lg border transition-all hover:shadow-md",
                  styles.bg
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-full bg-background/50", styles.iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {alert.contact_name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", styles.badgeBg)}
                      >
                        {alert.change_type === 'improved_to_high' 
                          ? '↑ Probabilidade Alta' 
                          : '↓ Probabilidade Muito Baixa'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        Score: {alert.current_score}%
                      </span>
                      {alert.previous_score !== null && (
                        <span className="text-xs">
                          (antes: {alert.previous_score}%)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/contatos/${alert.contact_id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick action for high probability */}
                {alert.change_type === 'improved_to_high' && (
                  <div className="mt-3 pt-3 border-t border-success/20">
                    <Button
                      size="sm"
                      className="w-full bg-success/20 hover:bg-success/30 text-success border border-success/30"
                      onClick={() => navigate(`/contatos/${alert.contact_id}`)}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Momento ideal para fechar!
                    </Button>
                  </div>
                )}

                {/* Quick action for very low probability */}
                {alert.change_type === 'dropped_to_very_low' && (
                  <div className="mt-3 pt-3 border-t border-destructive/20">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => navigate(`/contatos/${alert.contact_id}`)}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Avaliar situação e agir
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length > maxItems && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => navigate('/notificacoes')}
          >
            Ver mais {alerts.length - maxItems} alertas
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
