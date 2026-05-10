import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, User, Clock, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface LifeEventsAuditTrailProps {
  contactId: string;
}

export function LifeEventsAuditTrail({ contactId }: LifeEventsAuditTrailProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['life-events-audit', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_life_events_audit')
        .select('*')
        .eq('contact_id', contactId)
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  if (isLoading) {
    return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
  }

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="text-center p-6 border rounded-lg border-dashed">
        <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Nenhum histórico de alterações encontrado.</p>
      </div>
    );
  }

  const changeTypeColors: Record<string, string> = {
    INSERT: 'bg-success/10 text-success border-success/20',
    UPDATE: 'bg-primary/10 text-primary border-primary/20',
    DELETE: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const eventTypeLabels: Record<string, string> = {
    birthday: 'Aniversário',
    anniversary: 'Bodas',
    promotion: 'Promoção',
    travel: 'Viagem',
    family: 'Família',
    achievement: 'Conquista',
    other: 'Outro'
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        Auditoria de Marcos de Vida
      </h4>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {auditLogs.map((log) => (
            <div key={log.id} className="relative pl-6 pb-4 border-l border-border last:pb-0">
              <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-border" />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 h-4 ${changeTypeColors[log.change_type]}`}>
                    {log.change_type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                
                <p className="text-xs font-medium">
                  {log.title} <span className="text-muted-foreground font-normal text-[10px]">({eventTypeLabels[log.event_type] || log.event_type})</span>
                </p>
                
                {log.reason && (
                  <p className="text-[10px] text-muted-foreground italic bg-muted/30 p-1.5 rounded">
                    Motivo: {log.reason}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Por: {log.user_name || 'Sistema'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
