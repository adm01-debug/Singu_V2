import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConnectionAnomalies, type AnomalySeverity, type AnomalyType } from '@/hooks/useConnectionAnomalies';
import { AlertTriangle, Activity, TrendingDown, TrendingUp, Clock, Database, RefreshCw, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_META: Record<AnomalyType, { icon: typeof AlertTriangle; label: string }> = {
  error_spike: { icon: AlertTriangle, label: 'Pico de erros' },
  latency_degradation: { icon: Clock, label: 'Degradação de latência' },
  volume_drop: { icon: TrendingDown, label: 'Queda de volume' },
  volume_spike: { icon: TrendingUp, label: 'Pico de volume' },
  suspicious_window: { icon: Activity, label: 'Janela suspeita' },
  schema_drift: { icon: Database, label: 'Schema drift' },
};

const SEVERITY_VARIANT: Record<AnomalySeverity, 'secondary' | 'default' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
  critical: 'destructive',
};

export function AnomaliesWidget() {
  const { anomalies, isLoading, acknowledge, triggerScan } = useConnectionAnomalies({ onlyOpen: true });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Anomalias detectadas pela IA
          {anomalies.length > 0 && <Badge variant="destructive">{anomalies.length}</Badge>}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => triggerScan.mutate()}
          disabled={triggerScan.isPending}
        >
          {triggerScan.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
          Escanear agora
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-xs text-muted-foreground py-6 text-center">Carregando…</div>
        ) : anomalies.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            Nenhuma anomalia em aberto. Sistema saudável ✅
          </div>
        ) : (
          <ScrollArea className="max-h-72 pr-2">
            <ul className="space-y-2">
              {anomalies.map((a) => {
                const meta = TYPE_META[a.anomaly_type];
                const Icon = meta.icon;
                return (
                  <li key={a.id} className="border border-border/40 rounded-md p-3 flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <Badge variant={SEVERITY_VARIANT[a.severity]} className="text-[10px]">{a.severity}</Badge>
                        {a.confidence !== null && (
                          <span className="text-[10px] text-muted-foreground">
                            confiança {Math.round(a.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.explanation}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(a.detected_at), { addSuffix: true, locale: ptBR })}
                        {a.model_used && ` · ${a.model_used}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledge.mutate(a.id)}
                      disabled={acknowledge.isPending}
                      title="Reconhecer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
