import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { History, User, Zap, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

export function RelationshipAuditPanel({ contactId }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['relationship-audit', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_relationship_audit_logs')
        .select('id, change_source, contact_id, created_at, field_name, new_value, old_value, reason, trigger_name, user_id')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const getIcon = (source: string) => {
    switch (source) {
      case 'manual': return User;
      case 'automation': return Zap;
      default: return MessageSquare;
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      score: 'Score',
      stage: 'Estágio',
      sentiment: 'Sentimento',
      last_contact: 'Último Contato',
      interactions_count: 'Interações'
    };
    return labels[field] || field;
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Auditoria de Relacionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        {!logs || logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic">
            Nenhuma alteração registrada até o momento.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-border/50" />
            <div className="space-y-6">
              {logs.map((log) => {
                const Icon = getIcon(log.change_source);
                return (
                  <div key={log.id} className="relative pl-14 pr-4">
                    <div className={cn(
                      "absolute left-4 top-0 h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-background z-10",
                      log.change_source === 'manual' ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {getFieldLabel(log.field_name)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4 opacity-70">
                          {log.old_value || '—'}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className="text-[10px] font-bold px-1.5 py-0 h-4">
                          {log.new_value}
                        </Badge>
                      </div>
                      {log.reason && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 italic">
                          "{log.reason}"
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "text-[9px] uppercase font-bold px-1 rounded",
                          log.change_source === 'manual' ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-primary/5 text-primary border border-primary/10"
                        )}>
                          {log.change_source}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
