import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Activity, Database, MessageSquare, Mail, Mic, Shield, Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComponentCheck {
  status: 'up' | 'degraded' | 'down' | 'not_configured';
  latency_ms?: number;
  error?: string;
  last_activity?: string;
  details?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  total_latency_ms: number;
  components: Record<string, ComponentCheck>;
  alerts_count: number;
}

const COMPONENT_META: Record<string, { label: string; icon: React.ElementType }> = {
  database_local: { label: 'Banco de Dados Local', icon: Database },
  database_external: { label: 'Banco de Dados Externo', icon: Database },
  whatsapp: { label: 'WhatsApp (Evolution API)', icon: MessageSquare },
  email_pipeline: { label: 'Pipeline de Email', icon: Mail },
  voice_ai: { label: 'Voice AI (ElevenLabs)', icon: Mic },
};

const STATUS_CONFIG = {
  up: { label: 'Operacional', color: 'text-success', bg: 'bg-success/10', badge: 'default' as const },
  degraded: { label: 'Degradado', color: 'text-warning', bg: 'bg-warning/10', badge: 'secondary' as const },
  down: { label: 'Offline', color: 'text-destructive', bg: 'bg-destructive/10', badge: 'destructive' as const },
  not_configured: { label: 'Não configurado', color: 'text-muted-foreground', bg: 'bg-muted/30', badge: 'outline' as const },
};

const OVERALL_CONFIG = {
  healthy: { label: 'Todos os sistemas operacionais', color: 'text-success', bg: 'bg-success' },
  degraded: { label: 'Alguns sistemas degradados', color: 'text-warning', bg: 'bg-warning' },
  unhealthy: { label: 'Sistemas com falha', color: 'text-destructive', bg: 'bg-destructive' },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.down;
  return <span className={cn('w-3 h-3 rounded-full shrink-0', cfg.bg, 'border-2', `border-current`, cfg.color)} />;
}

export default function StatusPage() {
  const { data, isLoading, dataUpdatedAt } = useQuery<HealthResponse>({
    queryKey: ['public-system-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-health', { body: {} });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const overall = data?.status || 'healthy';
  const overallCfg = OVERALL_CONFIG[overall];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60">
        <div className="container mx-auto max-w-3xl py-8 px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Status do Sistema</h1>
          </div>

          {isLoading ? (
            <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ) : (
            <div className={cn('rounded-lg p-4 flex items-center gap-3', `${overallCfg.bg}/10`)}>
              <span className={cn('w-4 h-4 rounded-full', overallCfg.bg)} />
              <div>
                <p className={cn('font-semibold', overallCfg.color)}>{overallCfg.label}</p>
                <p className="text-xs text-muted-foreground">
                  Atualizado {dataUpdatedAt
                    ? formatDistanceToNow(dataUpdatedAt, { locale: ptBR, addSuffix: true })
                    : 'agora'}
                  {data?.total_latency_ms ? ` • ${data.total_latency_ms}ms` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Components */}
      <div className="container mx-auto max-w-3xl py-6 px-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Componentes
        </h2>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
          ))
        ) : (
          data?.components && Object.entries(data.components).map(([name, check]) => {
            const meta = COMPONENT_META[name] || { label: name, icon: Activity };
            const sCfg = STATUS_CONFIG[(check as ComponentCheck).status] || STATUS_CONFIG.down;
            const c = check as ComponentCheck;

            return (
              <Card key={name}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={c.status} />
                    <meta.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      {c.details && (
                        <p className="text-xs text-muted-foreground">{c.details}</p>
                      )}
                      {c.error && (
                        <p className="text-xs text-destructive">{c.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.latency_ms != null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {c.latency_ms}ms
                      </span>
                    )}
                    <Badge variant={sCfg.badge}>{sCfg.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        <Separator className="my-6" />

        <div className="text-center text-xs text-muted-foreground py-4">
          <p>SINGU CRM — Monitoramento de Saúde do Sistema</p>
          <p className="mt-1">Atualização automática a cada 60 segundos</p>
        </div>
      </div>
    </div>
  );
}
