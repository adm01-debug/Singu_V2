import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Navigate } from 'react-router-dom';
import { useErrorLogs, type ErrorLog } from '@/hooks/useErrorLogs';
import { Trash2, RefreshCw, AlertTriangle, User, Globe, Code } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  info: 'outline',
  warning: 'secondary',
  error: 'default',
  critical: 'destructive',
};

export default function ErrorLogsAdmin() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { logs, isLoading, refetch, clearLogs, isClearing } = useErrorLogs();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | string>('all');

  const filtered = useMemo(() => {
    return logs
      .filter((l) => severity === 'all' || l.severity === severity)
      .filter((l) =>
        !search.trim() ? true : (l.message + (l.stack ?? '') + (l.url ?? '')).toLowerCase().includes(search.toLowerCase()),
      );
  }, [logs, search, severity]);

  if (adminLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleRefresh = async () => {
    await refetch();
    toast.success('Logs atualizados');
  };

  const handleClear = async () => {
    if (!confirm('Deseja realmente excluir TODOS os logs de erro do banco de dados?')) return;
    try {
      await clearLogs();
      toast.success('Logs excluídos com sucesso');
    } catch (err) {
      toast.error('Erro ao excluir logs');
    }
  };

  const severities = ['all', 'critical', 'error', 'warning', 'info'];

  return (
    <>
      <Helmet>
        <title>Error Logs — Admin</title>
        <meta name="description" content="Painel admin de logs de erro capturados em produção." />
      </Helmet>
      <div className="container mx-auto p-6 space-y-4 max-w-7xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="size-6 text-destructive" />
              Logs de Erro em Produção
            </h1>
            <p className="text-sm text-muted-foreground">
              Exibindo {filtered.length} de {logs.length} eventos registrados no banco.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} /> Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={isClearing || logs.length === 0}>
              <Trash2 className="size-4 mr-2" /> Limpar Banco
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <Input
                placeholder="Buscar por mensagem, URL ou stack…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
              <div className="flex gap-1 border rounded-md p-1 bg-muted/50">
                {severities.map((s) => (
                  <Button
                    key={s}
                    variant={severity === s ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSeverity(s)}
                    className="capitalize h-8 text-xs px-3"
                  >
                    {s === 'all' ? 'Todos' : s}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <AlertTriangle className="size-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">Nenhum log encontrado para os filtros atuais.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((log) => (
                    <div key={log.id} className="border rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <Badge variant={SEVERITY_VARIANT[log.severity]} className="capitalize font-mono">
                            {log.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="size-3" /> {log.user_id ? log.user_id.slice(0, 8) : 'Anônimo'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="p-3 space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground break-words leading-tight">
                            {log.message}
                          </p>
                          {log.url && (
                            <div className="flex items-center gap-1 text-[10px] text-primary hover:underline truncate">
                              <Globe className="size-3" />
                              <a href={log.url} target="_blank" rel="noreferrer">{log.url}</a>
                            </div>
                          )}
                        </div>

                        {(log.stack || (log.context && Object.keys(log.context as object).length > 0)) && (
                          <div className="flex gap-4">
                            {log.stack && (
                              <details className="flex-1 group">
                                <summary className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground flex items-center gap-1 list-none">
                                  <Code className="size-3" /> Stack Trace
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-950 text-slate-300 text-[10px] rounded-md overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-border">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                            
                            {log.context && Object.keys(log.context as object).length > 0 && (
                              <details className="flex-1 group">
                                <summary className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground flex items-center gap-1 list-none">
                                  <Code className="size-3" /> Context Metadata
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-950 text-slate-300 text-[10px] rounded-md overflow-x-auto font-mono border border-border">
                                  {JSON.stringify(log.context, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                        
                        {log.user_agent && (
                          <p className="text-[9px] text-muted-foreground italic border-t pt-2 mt-2">
                            UA: {log.user_agent}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
