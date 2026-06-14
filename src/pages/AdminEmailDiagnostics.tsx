import { Helmet } from 'react-helmet-async';
import { Mail, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmailPipelineHealth, useRefreshPipelineHealth } from '@/hooks/useEmailPipelineHealth';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AccessibleChart } from '@/components/ui/accessible-chart';

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, label: 'Saudável', color: 'text-success', bg: 'bg-success/10' },
  degraded: { icon: AlertTriangle, label: 'Degradado', color: 'text-warning', bg: 'bg-warning/10' },
  offline: { icon: XCircle, label: 'Offline', color: 'text-destructive', bg: 'bg-destructive/10' },
} as const;

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'offline' }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold', cfg.bg, cfg.color)}>
      <Icon className="h-5 w-5" />
      {cfg.label}
    </div>
  );
}

function SellerTable({ sellers }: { sellers: Array<{ from_email: string; count: number }> }) {
  if (!Array.isArray(sellers) || sellers.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum dado de vendedor disponível.</p>;
  }

  const sorted = [...sellers].sort((a, b) => b.count - a.count);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Vendedor</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Emails (24h)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.from_email} className="border-b border-border/40">
              <td className="py-2 px-3">{s.from_email}</td>
              <td className="py-2 px-3 text-right font-medium">{s.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolumeChart({ sellers }: { sellers: Array<{ from_email: string; count: number }> }) {
  if (!Array.isArray(sellers) || sellers.length === 0) return null;

  const chartData = sellers
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((s) => ({
      name: s.from_email.split('@')[0] || s.from_email,
      emails: s.count,
    }));

  return (
    <AccessibleChart
      summary="Volume de emails por vendedor nas últimas 24h"
      data={chartData.map((d) => ({ label: d.name, value: d.emails }))}
      columns={['Vendedor', 'Emails']}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
          <YAxis className="text-xs fill-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Bar dataKey="emails" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </AccessibleChart>
  );
}

function AnomalyAlerts({ sellers }: { sellers: Array<{ from_email: string; count: number }> }) {
  if (!Array.isArray(sellers) || sellers.length === 0) return null;

  const inactive = sellers.filter((s) => s.count === 0);
  const lowActivity = sellers.filter((s) => s.count > 0 && s.count < 3);

  if (inactive.length === 0 && lowActivity.length === 0) {
    return (
      <div className="flex items-center gap-2 text-success text-sm">
        <CheckCircle2 className="h-4 w-4" />
        Nenhuma anomalia detectada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {inactive.map((s) => (
        <div key={s.from_email} className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span><strong>{s.from_email}</strong> — sem emails nas últimas 24h</span>
        </div>
      ))}
      {lowActivity.map((s) => (
        <div key={s.from_email} className="flex items-center gap-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{s.from_email}</strong> — apenas {s.count} email(s) nas últimas 24h</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminEmailDiagnostics() {
  const { data, isLoading } = useEmailPipelineHealth();
  const refresh = useRefreshPipelineHealth();

  const status = data?.status ?? 'offline';
  const sellers = data?.stats_24h?.by_seller ?? [];
  const total24h = data?.stats_24h?.total_24h ?? 0;

  const lastEmailLabel = data?.last_email_at
    ? formatDistanceToNow(new Date(data.last_email_at), { addSuffix: true, locale: ptBR })
    : 'Nenhum registro';

  const checkedAtLabel = data?.checked_at
    ? format(new Date(data.checked_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : '—';

  return (
    <>
      <Helmet>
        <title>Diagnóstico de Email | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico de Email</h1>
            <p className="text-muted-foreground text-sm">
              Monitoramento da pipeline Google Workspace → Pub/Sub → Webhook
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refresh.isPending && 'animate-spin')} />
            Verificar Agora
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-20 animate-pulse rounded bg-muted/40" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {/* Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <StatusBadge status={status} />
                  <p className="text-xs text-muted-foreground">
                    Verificado: {checkedAtLabel}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{lastEmailLabel}</p>
                  <p className="text-xs text-muted-foreground">Último email recebido</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-2xl font-bold">{total24h}</p>
                  <p className="text-xs text-muted-foreground">Emails nas últimas 24h</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Volume por Vendedor (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VolumeChart sellers={sellers} />
              </CardContent>
            </Card>

            {/* Seller Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <SellerTable sellers={sellers} />
              </CardContent>
            </Card>

            {/* Anomalies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas de Anomalias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnomalyAlerts sellers={sellers} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
