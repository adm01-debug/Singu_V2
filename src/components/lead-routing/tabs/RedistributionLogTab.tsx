import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RotateCcw, ArrowRight, Calendar } from 'lucide-react';
import type { SalesTeamMember } from '@/types/leadRouting';
import { REASON_LABELS } from '@/types/leadRouting';

function useRedistributionLog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['redistribution-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redistribution_log')
        .select('id, from_member_id, to_member_id, reason, auto_triggered, inactivity_days, created_at, notes')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export default function RedistributionLogTab() {
  const { data: logs = [], isLoading } = useRedistributionLog();
  const { data: members = [] } = useSalesTeam();
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const membersMap = useMemo(() => {
    const map = new Map<string, SalesTeamMember>();
    if (Array.isArray(members)) {
      members.forEach((m) => map.set(m.id, m));
    }
    return map;
  }, [members]);

  const filtered = useMemo(() => {
    if (reasonFilter === 'all') return logs;
    return logs.filter((l: Record<string, unknown>) => l.reason === reasonFilter);
  }, [logs, reasonFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const reasons = [...new Set(logs.map((l: Record<string, unknown>) => l.reason as string))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} redistribuição(ões)</p>
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os motivos</SelectItem>
            {reasons.map((r) => (
              <SelectItem key={r} value={r}>{REASON_LABELS[r as keyof typeof REASON_LABELS] ?? r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((log: Record<string, unknown>) => {
          const fromMember = membersMap.get(log.from_member_id as string);
          const toMember = log.to_member_id ? membersMap.get(log.to_member_id as string) : null;
          const reason = REASON_LABELS[(log.reason as string) as keyof typeof REASON_LABELS] ?? (log.reason as string);

          return (
            <Card key={log.id as string} className="border">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium">{fromMember?.name ?? 'Membro removido'}</span>
                      {toMember && (
                        <>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{toMember.name}</span>
                        </>
                      )}
                      <Badge variant="outline" className="text-xs">{reason}</Badge>
                      {log.auto_triggered && (
                        <Badge variant="secondary" className="text-xs">Auto</Badge>
                      )}
                      {log.inactivity_days && (
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          {log.inactivity_days as number}d inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.created_at as string), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {' · '}
                      {formatDistanceToNow(new Date(log.created_at as string), { addSuffix: true, locale: ptBR })}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{log.notes as string}"</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma redistribuição registrada</p>
              <p className="text-xs mt-1">Os registros de redistribuição automática aparecerão aqui.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
