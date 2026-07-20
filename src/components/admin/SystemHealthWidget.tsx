import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Activity, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const STATUS_CONFIG = {
  healthy: { color: 'bg-success', label: 'Saudável', dot: 'bg-success' },
  degraded: { color: 'bg-warning', label: 'Degradado', dot: 'bg-warning' },
  unhealthy: { color: 'bg-destructive', label: 'Offline', dot: 'bg-destructive' },
} as const;

const COMPONENT_LABELS: Record<string, string> = {
  database_local: 'Banco Local',
  database_external: 'Banco Externo',
  whatsapp: 'WhatsApp',
  email_pipeline: 'Email Pipeline',
  voice_ai: 'Voice AI',
};

function ComponentRow({ name, check }: { name: string; check: ComponentCheck }) {
  const statusColors = {
    up: 'text-success',
    degraded: 'text-warning',
    down: 'text-destructive',
    not_configured: 'text-muted-foreground',
  };
  const statusLabels = {
    up: 'Online',
    degraded: 'Degradado',
    down: 'Offline',
    not_configured: 'N/C',
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs">{COMPONENT_LABELS[name] || name}</span>
      <div className="flex items-center gap-2">
        {check.latency_ms != null && (
          <span className="text-[10px] text-muted-foreground">{check.latency_ms}ms</span>
        )}
        <span className={cn('text-xs font-medium', statusColors[check.status])}>
          {statusLabels[check.status]}
        </span>
      </div>
    </div>
  );
}

export function SystemHealthWidget() {
  const { isAdmin } = useIsAdmin();

  const { data, isLoading, refetch } = useQuery<HealthResponse>({
    queryKey: ['system-health-widget'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-health', { body: {} });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    enabled: isAdmin,
  });

  if (!isAdmin) return null;

  const status = data?.status || 'healthy';
  const cfg = STATUS_CONFIG[status];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <span className={cn('w-2 h-2 rounded-full', isLoading ? 'bg-muted-foreground animate-pulse' : cfg.dot)} />
          <Activity className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
              <span className="text-sm font-medium">{cfg.label}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          {data?.total_latency_ms && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Verificado em {data.total_latency_ms}ms
            </p>
          )}
        </div>
        <div className="p-3 space-y-0.5">
          {data?.components && Object.entries(data.components).map(([name, check]) => (
            <ComponentRow key={name} name={name} check={check as ComponentCheck} />
          ))}
          {data?.alerts_count != null && data.alerts_count > 0 && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/60">
              <span className="text-xs">Alertas ativos</span>
              <Badge variant="destructive" className="text-[10px]">{data.alerts_count}</Badge>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
