import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  X,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from "@/lib/logger";

interface CompatibilityAlert {
  id: string;
  contact_id: string;
  compatibility_score: number;
  threshold: number;
  title: string;
  description: string | null;
  dismissed: boolean;
  created_at: string;
  contact?: {
    first_name: string;
    last_name: string;
  };
}

interface CompatibilityAlertsListProps {
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

export function CompatibilityAlertsList({ 
  className,
  maxItems = 5,
  showHeader = true,
}: CompatibilityAlertsListProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<CompatibilityAlert[]>([]);

  const fetchAlerts = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compatibility_alerts')
        .select(`
          *,
          contact:contacts(first_name, last_name)
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (signal?.cancelled) return;
      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      logger.error('Error fetching alerts:', err);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [user, maxItems]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchAlerts(signal);
    return () => { signal.cancelled = true; };
  }, [fetchAlerts]);

  const handleDismiss = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('compatibility_alerts')
        .update({ dismissed: true })
        .eq('user_id', user!.id)
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta dispensado');
    } catch {
      toast.error('Erro ao dispensar alerta');
    }
  };

  const handleDismissAll = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('compatibility_alerts')
        .update({ dismissed: true })
        .eq('user_id', user.id)
        .eq('dismissed', false);

      if (error) throw error;

      setAlerts([]);
      toast.success('Todos os alertas foram dispensados');
    } catch {
      toast.error('Erro ao dispensar alertas');
    }
  };

  const getSeverityColor = (score: number, threshold: number) => {
    const diff = threshold - score;
    if (diff >= 30) return 'border-destructive bg-destructive dark:bg-destructive/30';
    if (diff >= 15) return 'border-warning/30 bg-warning dark:bg-warning/30';
    return 'border-warning bg-warning dark:bg-warning/30';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
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
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-warning" />
                Alertas de Compatibilidade
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {alerts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Clientes com compatibilidade abaixo do limite
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Atualizar" onClick={fetchAlerts} className="h-8 w-8">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {alerts.length > <Button variant="ghost" size="icon" aria-label="Remover" onClick={handleDismissAll} className="h-8 w-8">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>              </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn(!showHeader && 'pt-6')}>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
            <p className="text-sm font-medium text-success">
              Nenhum alerta ativo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos os seus clientes estão com boa compatibilidade
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] -mx-2 px-2">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    'mb-3 p-3 rounded-lg border-l-4 transition-all',
                    getSeverityColor(alert.compatibility_score, alert.threshold)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {alert.contact?.first_name} {alert.contact?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Compatibilidade em{' '}
                          <span className="font-semibold text-destructive">
                            {alert.compatibility_score}%
                          </span>
                          {' '}(limite: {alert.threshold}%)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(alert.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Dispensar alerta"
                        className="h-7 w-7"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <X className="w-4 h-4" />
          <Button
                        variant="ghost"
                        size="icon" aria-label="Próximo"
                        className="h-7 w-7"
                        asChild
                      >
                        <Link to={`/contatos/${alert.contact_id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>     </Link>
                      </Button>
                    </div>
                  </div>

                  {alert.description && (
                    <p className="text-xs text-muted-foreground mt-2 pl-8">
                      {alert.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
