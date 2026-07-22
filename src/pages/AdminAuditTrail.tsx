import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuditDiffViewer } from '@/components/admin/AuditDiffViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FileText, Download, Search, ChevronDown, Clock, Plus, Pencil, Trash2,
  Filter, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type AuditEntry = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
};

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  INSERT: { label: 'Criação', icon: Plus, color: 'text-success' },
  UPDATE: { label: 'Atualização', icon: Pencil, color: 'text-warning' },
  DELETE: { label: 'Exclusão', icon: Trash2, color: 'text-destructive' },
  EXTERNAL_SYNC: { label: 'Sincronização Externa', icon: RefreshCw, color: 'text-info' },
};

const ENTITY_LABELS: Record<string, string> = {
  contacts: 'Contatos',
  companies: 'Empresas',
  interactions: 'Interações',
  alerts: 'Alertas',
  automation_rules: 'Automações',
};

const PERIOD_OPTIONS = [
  { value: '1', label: 'Último dia' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todos' },
];

export default function AdminAuditTrail() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['audit-trail', entityFilter, actionFilter, periodFilter],
    queryFn: async () => {
      // Query regular audit_log
      let auditQuery = supabase
        .from('audit_log')
        .select('id, entity_type, entity_id, action, old_data, new_data, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(400);

      if (entityFilter !== 'all') auditQuery = auditQuery.eq('entity_type', entityFilter);
      if (actionFilter !== 'all') {
        if (actionFilter !== 'EXTERNAL_SYNC') auditQuery = auditQuery.eq('action', actionFilter);
        else return []; // Skip if only sync is requested for audit_log
      }
      if (periodFilter !== 'all') {
        const since = subDays(new Date(), Number(periodFilter)).toISOString();
        auditQuery = auditQuery.gte('created_at', since);
      }

      const { data: auditData, error: auditError } = await auditQuery;
      if (auditError) throw auditError;

      // Query external sync logs if relevant
      if (actionFilter === 'all' || actionFilter === 'EXTERNAL_SYNC') {
        // Query some other table that logs external syncs or just return auditData
        // For now, we assume external_sync is a type of action in audit_log too
      }

      return (auditData || []) as AuditEntry[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Distinct entity types for filter
  const entityTypes = useMemo(() => {
    const types = new Set(entries.map(e => e.entity_type));
    return Array.from(types).sort();
  }, [entries]);

  // Search filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e => {
      const oldStr = JSON.stringify(e.old_data || {}).toLowerCase();
      const newStr = JSON.stringify(e.new_data || {}).toLowerCase();
      return (
        oldStr.includes(q) ||
        newStr.includes(q) ||
        e.entity_type.toLowerCase().includes(q) ||
        e.entity_id.toLowerCase().includes(q)
      );
    });
  }, [entries, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    inserts: filtered.filter(e => e.action === 'INSERT').length,
    updates: filtered.filter(e => e.action === 'UPDATE').length,
    deletes: filtered.filter(e => e.action === 'DELETE').length,
  }), [filtered]);

  const exportData = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado como JSON');
    } else {
      const headers = ['Data', 'Entidade', 'ID', 'Operação', 'Usuário'];
      const rows = filtered.map(e => [
        e.created_at,
        e.entity_type,
        e.entity_id,
        e.action,
        e.user_id,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado como CSV');
    }
  };

  if (adminLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Audit Trail</h1>
              <p className="text-sm text-muted-foreground">
                Histórico completo de alterações no sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('json')}>
              <Download className="w-4 h-4 mr-1" /> JSON
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-success">{stats.inserts}</div>
              <div className="text-xs text-muted-foreground">Criações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-warning">{stats.updates}</div>
              <div className="text-xs text-muted-foreground">Atualizações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.deletes}</div>
              <div className="text-xs text-muted-foreground">Exclusões</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos dados..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {entityTypes.map(t => (
                    <SelectItem key={t} value={t}>
                      {ENTITY_LABELS[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as operações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-2">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando registros...</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum registro encontrado</CardContent></Card>
          ) : (
            filtered.map(entry => {
              const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.UPDATE;
              const ActionIcon = config.icon;
              const isExpanded = expandedId === entry.id;

              return (
                <Collapsible key={entry.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : entry.id)}>
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left">
                        <CardContent className="py-3 flex items-center gap-3">
                          <div className={`p-1.5 rounded-md bg-muted/50 ${config.color}`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {config.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-32">
                                {entry.entity_id.slice(0, 8)}…
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground" title={format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm:ss')}>
                                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </CardContent>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-4 pt-0">
                        <Separator className="mb-3" />
                        <AuditDiffViewer
                          oldData={entry.old_data as Record<string, unknown> | null}
                          newData={entry.new_data as Record<string, unknown> | null}
                          action={entry.action}
                        />
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
