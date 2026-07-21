import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, RefreshCw, Search, Webhook, Zap } from 'lucide-react';
import { WebhookDlqPanel } from '@/components/admin/conexoes/WebhookDlqPanel';
import { AnomaliesWidget } from '@/components/admin/conexoes/AnomaliesWidget';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type LogSource = 'all' | 'connection' | 'webhook';
type LogStatus = 'all' | 'success' | 'error';

interface UnifiedLog {
  id: string;
  source: 'connection' | 'webhook';
  status: string;
  created_at: string;
  latency_ms: number | null;
  message: string | null;
  http_status?: number | null;
  payload?: unknown;
  response?: unknown;
  details?: unknown;
  ref_id: string;
  ref_label: string;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary';
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms == null) return <span className="text-muted-foreground text-xs">—</span>;
  const tone = ms < 300 ? 'default' : ms < 1000 ? 'secondary' : 'destructive';
  return <Badge variant={tone} className="font-mono text-xs">{ms}ms</Badge>;
}

export default function AdminConexoesLogs() {
  const [source, setSource] = useState<LogSource>('all');
  const [status, setStatus] = useState<LogStatus>('all');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UnifiedLog | null>(null);

  const sinceIso = useMemo(() => {
    const ms = period === '24h' ? 24 : period === '7d' ? 24 * 7 : 24 * 30;
    return new Date(Date.now() - ms * 3_600_000).toISOString();
  }, [period]);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conexoes-unified-logs', source, status, period],
    queryFn: async (): Promise<UnifiedLog[]> => {
      const queries: Promise<UnifiedLog[]>[] = [];

      if (source === 'all' || source === 'connection') {
        queries.push((async () => {
          let q = supabase
            .from('connection_test_logs')
            .select('id,connection_id,status,latency_ms,message,details,created_at,connection_configs(name)')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200);
          if (status !== 'all') q = q.eq('status', status);
          const { data, error } = await q;
          if (error) throw error;
          return (data ?? []).map((r): UnifiedLog => ({
            id: r.id,
            source: 'connection',
            status: r.status,
            created_at: r.created_at,
            latency_ms: r.latency_ms,
            message: r.message,
            details: r.details,
            ref_id: r.connection_id,
            ref_label: (r.connection_configs as { name?: string } | null)?.name ?? 'Conexão',
          }));
        })());
      }

      if (source === 'all' || source === 'webhook') {
        queries.push((async () => {
          let q = supabase
            .from('incoming_webhook_logs')
            .select('id,webhook_id,status,http_status,latency_ms,error_message,payload,response,created_at,incoming_webhooks(name)')
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200);
          if (status !== 'all') q = q.eq('status', status);
          const { data, error } = await q;
          if (error) throw error;
          return (data ?? []).map((r): UnifiedLog => ({
            id: r.id,
            source: 'webhook',
            status: r.status,
            created_at: r.created_at,
            latency_ms: r.latency_ms,
            http_status: r.http_status,
            message: r.error_message,
            payload: r.payload,
            response: r.response,
            ref_id: r.webhook_id,
            ref_label: (r.incoming_webhooks as { name?: string } | null)?.name ?? 'Webhook',
          }));
        })());
      }

      const results = await Promise.all(queries);
      return results.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const s = search.toLowerCase();
    return logs.filter(l =>
      l.ref_label.toLowerCase().includes(s) ||
      (l.message ?? '').toLowerCase().includes(s) ||
      l.id.toLowerCase().includes(s)
    );
  }, [logs, search]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-7 w-7 text-primary" aria-hidden="true" />
              Logs de Conexões
            </h1>
            <p className="text-muted-foreground">Histórico unificado de testes de conexão e chamadas de webhooks entrantes.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Atualizar
          </Button>
        </header>

        <AnomaliesWidget />

        <WebhookDlqPanel />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Tabs value={source} onValueChange={(v) => setSource(v as LogSource)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="connection">Conexões</TabsTrigger>
                <TabsTrigger value="webhook">Webhooks</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={status} onValueChange={(v) => setStatus(v as LogStatus)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as '24h' | '7d' | '30d')}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Buscar por nome, mensagem ou id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Buscar nos logs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{filtered.length} {filtered.length === 1 ? 'evento' : 'eventos'}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Activity}
                  title="Nenhum log encontrado"
                  description="Ajuste os filtros ou aguarde novas chamadas para ver eventos aqui."
                />
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh]">
                <ul className="divide-y" role="list">
                  {filtered.map((log) => (
                    <li key={`${log.source}-${log.id}`}>
                      <button
                        type="button"
                        onClick={() => setSelected(log)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none flex items-center gap-3"
                      >
                        {log.source === 'webhook'
                          ? <Webhook className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                          : <Zap className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{log.ref_label}</span>
                            <Badge variant="outline" className="text-xs capitalize">{log.source === 'webhook' ? 'webhook' : 'conexão'}</Badge>
                            <StatusBadge status={log.status} />
                            <LatencyBadge ms={log.latency_ms} />
                            {log.http_status != null && (
                              <Badge variant="secondary" className="font-mono text-xs">HTTP {log.http_status}</Badge>
                            )}
                          </div>
                          {log.message && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{log.message}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selected.source === 'webhook' ? <Webhook className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                    {selected.ref_label}
                  </SheetTitle>
                  <SheetDescription>
                    {new Date(selected.created_at).toLocaleString('pt-BR')} · <StatusBadge status={selected.status} />
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 text-sm">
                  {selected.message && (
                    <section>
                      <h3 className="font-semibold mb-1">Mensagem</h3>
                      <p className="text-muted-foreground">{selected.message}</p>
                    </section>
                  )}
                  {selected.payload != null && (
                    <section>
                      <h3 className="font-semibold mb-1">Payload</h3>
                      <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto max-h-72">
                        {JSON.stringify(selected.payload, null, 2)}
                      </pre>
                    </section>
                  )}
                  {selected.response != null && (
                    <section>
                      <h3 className="font-semibold mb-1">Resposta</h3>
                      <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto max-h-72">
                        {JSON.stringify(selected.response, null, 2)}
                      </pre>
                    </section>
                  )}
                  {selected.details != null && (
                    <section>
                      <h3 className="font-semibold mb-1">Detalhes</h3>
                      <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto max-h-72">
                        {JSON.stringify(selected.details, null, 2)}
                      </pre>
                    </section>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}
