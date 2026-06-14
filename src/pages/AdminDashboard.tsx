import { useQuery } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useSecretRotation, KNOWN_SECRETS } from '@/hooks/useSecretRotation';
import { daysSince, getSecretHealth } from '@/lib/secretRotation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  HeartPulse, Database, Plug, Shield, ArrowRight,
  Activity, AlertTriangle, Mail, Mic, Sparkles,
  BookOpen, Map, Key, Settings, FileText,
} from 'lucide-react';

// ── Status Cards Row ──
function StatusCard({ title, icon: Icon, status, detail }: {
  title: string;
  icon: React.ElementType;
  status: 'healthy' | 'warning' | 'error' | 'loading';
  detail: string;
}) {
  const statusColors = {
    healthy: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
    loading: 'text-muted-foreground animate-pulse',
  };
  const badgeVariants = {
    healthy: 'default' as const,
    warning: 'secondary' as const,
    error: 'destructive' as const,
    loading: 'outline' as const,
  };
  const statusLabels = {
    healthy: 'Saudável',
    warning: 'Atenção',
    error: 'Offline',
    loading: 'Verificando...',
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${statusColors[status]}`} />
            <span className="font-medium text-sm">{title}</span>
          </div>
          <Badge variant={badgeVariants[status]}>{statusLabels[status]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

// ── Tool Card ──
function ToolCard({ title, description, icon: Icon, to }: {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
}) {
  return (
    <Link to={to} className="block group">
      <Card variant="interactive" className="h-full">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{title}</h3>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const ADMIN_TOOLS = [
  { title: 'Conexões', description: 'Supabase externos, Bitrix24, n8n, MCP Claude e webhooks', icon: Plug, to: '/admin/conexoes' },
  { title: 'Telemetria de Queries', description: 'Monitor de performance do banco externo', icon: Activity, to: '/admin/telemetria' },
  { title: 'Schema Drift Monitor', description: 'Detectar inconsistências de schema', icon: AlertTriangle, to: '/admin/schema-drift' },
  { title: 'Field Mapping Docs', description: 'Documentação de mapeamento campo-a-campo', icon: Map, to: '/admin/field-mapping' },
  { title: 'Email Pipeline', description: 'Saúde da pipeline de email', icon: Mail, to: '/admin/email-diagnostics' },
  { title: 'Voice AI Diagnostics', description: 'Diagnóstico do agente de voz', icon: Mic, to: '/admin/voice-diagnostics' },
  { title: 'Lux Intelligence', description: 'Configuração de webhooks n8n', icon: Sparkles, to: '/admin/lux-config' },
  { title: 'Secrets Management', description: 'Rotação e gestão de secrets', icon: Key, to: '/admin/secrets-management' },
  { title: 'Audit Trail', description: 'Visualizador de trilha de auditoria', icon: FileText, to: '/admin/audit-trail' },
  { title: 'Knowledge Export', description: 'Exportar conhecimento para handoff', icon: BookOpen, to: '/admin/knowledge-export' },
];

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Health check
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['admin-health-check'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('health', { body: {} });
        if (error) return { status: 'error' };
        return data as { status: string; checks?: Record<string, { status: string; latencyMs?: number }> };
      } catch {
        return { status: 'error' };
      }
    },
    staleTime: 60_000,
  });

  // Secret health
  const { getLastRotation } = useSecretRotation();
  const criticalSecrets = KNOWN_SECRETS.filter(s => {
    const last = getLastRotation(s.name);
    if (!last) return s.critical;
    return getSecretHealth(daysSince(last.rotated_at)) === 'critical';
  });

  // Active alerts count
  const { data: alertCount = 0 } = useQuery({
    queryKey: ['admin-active-alerts'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('dismissed', false);
      if (error) return 0;
      return count || 0;
    },
    staleTime: 60_000,
  });

  if (adminLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const systemStatus = healthLoading ? 'loading' : (healthData?.status === 'healthy' ? 'healthy' : 'error');
  const dbStatus = healthLoading
    ? 'loading'
    : healthData?.checks?.database?.status === 'healthy'
      ? 'healthy'
      : 'error';
  const extDbStatus = healthLoading
    ? 'loading'
    : healthData?.checks?.external_database?.status === 'healthy'
      ? 'healthy'
      : 'warning';
  const securityStatus = criticalSecrets.length > 0 ? 'warning' : 'healthy';

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Central de Administração</h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento e ferramentas do sistema SINGU
            </p>
          </div>
        </div>

        <Separator />

        {/* Row 1: Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Sistema"
            icon={HeartPulse}
            status={systemStatus}
            detail={systemStatus === 'healthy' ? 'Todos os serviços operacionais' : 'Verificar health endpoint'}
          />
          <StatusCard
            title="Banco Externo"
            icon={Database}
            status={extDbStatus}
            detail={extDbStatus === 'healthy'
              ? `Latência: ${healthData?.checks?.external_database?.latencyMs || '?'}ms`
              : 'Conexão degradada ou offline'}
          />
          <StatusCard
            title="Integrações"
            icon={Plug}
            status={dbStatus}
            detail="WhatsApp, Email, Voice AI"
          />
          <StatusCard
            title="Segurança"
            icon={Shield}
            status={securityStatus}
            detail={criticalSecrets.length > 0
              ? `${criticalSecrets.length} secret(s) precisam rotação`
              : 'Secrets atualizados'}
          />
        </div>

        {/* Row 1.5: Quick Actions */}
        <AdminQuickActions />

        {/* Row 2: Active Alerts */}
        {alertCount > 0 && (
          <Card variant="warning">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span className="font-medium text-sm">
                    {alertCount} alerta{alertCount > 1 ? 's' : ''} ativo{alertCount > 1 ? 's' : ''}
                  </span>
                </div>
                <Badge variant="secondary">{alertCount}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {criticalSecrets.length > 0 && (
          <Card variant="destructive">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-destructive" />
                <span className="font-medium text-sm">Secrets com rotação pendente</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {criticalSecrets.map(s => (
                  <Badge key={s.name} variant="destructive">{s.name}</Badge>
                ))}
              </div>
              <Link
                to="/admin/secrets-management"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                Gerenciar secrets →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Row 3: Tools Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Ferramentas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {ADMIN_TOOLS.map(tool => (
              <ToolCard key={tool.to} {...tool} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
