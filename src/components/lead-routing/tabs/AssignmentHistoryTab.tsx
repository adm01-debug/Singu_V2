import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadAssignments } from '@/hooks/useLeadRouting';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';
import type { SalesTeamMember } from '@/types/leadRouting';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: 'Ativo', icon: Clock, color: 'bg-info/10 text-info border-info/30' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'bg-success/10 text-success border-success/30' },
  expired: { label: 'Expirado', icon: AlertTriangle, color: 'bg-warning/10 text-warning border-warning/30' },
  reassigned: { label: 'Reassignado', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

const TYPE_LABELS: Record<string, string> = {
  auto_round_robin: 'Round-Robin',
  auto_weighted: 'Ponderado',
  auto_territory: 'Território',
  manual: 'Manual',
  handoff: 'Handoff',
  redistribution: 'Redistribuição',
};

export default function AssignmentHistoryTab() {
  const { data: assignments = [], isLoading } = useLeadAssignments();
  const { data: members = [] } = useSalesTeam();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const membersMap = useMemo(() => {
    const map = new Map<string, SalesTeamMember>();
    if (Array.isArray(members)) {
      members.forEach((m) => map.set(m.id, m));
    }
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    let result = Array.isArray(assignments) ? assignments : [];
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const member = membersMap.get(a.assigned_to);
        const memberName = member?.name?.toLowerCase() ?? '';
        return memberName.includes(q) || a.assignment_type.includes(q);
      });
    }
    return result;
  }, [assignments, statusFilter, search, membersMap]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const counts = {
    all: assignments.length,
    active: assignments.filter((a) => a.status === 'active').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
    expired: assignments.filter((a) => a.status === 'expired').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="active">Ativos ({counts.active})</SelectItem>
            <SelectItem value="completed">Concluídos ({counts.completed})</SelectItem>
            <SelectItem value="expired">Expirados ({counts.expired})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} distribuição{filtered.length !== 1 ? 'ões' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {filtered.slice(0, 50).map((a) => {
          const config = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.active;
          const Icon = config.icon;
          const member = membersMap.get(a.assigned_to);
          const slaOk = a.sla_met === true;
          const slaFail = a.sla_met === false;

          return (
            <Card key={a.id} className="border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {member?.name ?? 'Vendedor removido'}
                        </span>
                        <Badge className={config.color}>{config.label}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[a.assignment_type] ?? a.assignment_type}
                        </Badge>
                        {slaOk && <Badge variant="outline" className="text-xs text-success border-success/30">SLA ✓</Badge>}
                        {slaFail && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">SLA ✗</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        {' · '}
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                        {a.first_contact_at && (
                          <span className="text-success"> · 1º contato em {formatDistanceToNow(new Date(a.first_contact_at), { addSuffix: true, locale: ptBR })}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma distribuição encontrada</p>
              <p className="text-xs mt-1">As distribuições de leads aparecerão aqui quando realizadas.</p>
            </CardContent>
          </Card>
        )}

        {filtered.length > 50 && (
          <p className="text-xs text-center text-muted-foreground py-2">
            Mostrando 50 de {filtered.length} registros
          </p>
        )}
      </div>
    </div>
  );
}
