import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, User, TrendingUp, Info, ListFilter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';

interface AuditLog {
  id: string;
  created_at: string;
  recommendation_type: string;
  score: number | null;
  user_action: string | null;
  reasons?: string[] | null;
  data_used?: Record<string, unknown> | null;
  contacts?: { first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null;
}

export default function RecommendationAudit() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['ai-recommendation-audit-logs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_recommendation_audit_logs_v2')
        .select(`
          *,
          contacts:contact_id (first_name, last_name, avatar_url)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as AuditLog[];
    }
  });

  return (
    <AppLayout>
      <Header 
        title="Auditoria de IA" 
        subtitle="Rastreamento de decisões e priorizações da inteligência artificial"
        hideBack
      />
      
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground italic">Nenhum log de recomendação registrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors shadow-sm">
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">
                          {log.recommendation_type === 'next_step' ? 'Próximo Passo Sugerido' : 
                           log.recommendation_type === 'next_step_view' ? 'Visualização de Detalhes' : 
                           'Recomendação Estratégica'}
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground italic">
                          ID: {log.id.slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] tabular-nums gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                        <User className="w-5 h-5 text-primary/60" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {log.contacts?.first_name} {log.contacts?.last_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span className="text-[11px] font-bold text-success">Score IA: {log.score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={log.user_action ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold">
                        {log.user_action || 'Calculado'}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <ListFilter className="w-3 h-3" /> Motivos da Priorização
                    </div>
                    <ul className="space-y-1.5">
                      {log.reasons?.map((reason: string, i: number) => (
                        <li key={i} className="text-xs text-foreground/80 flex gap-2">
                          <span className="text-primary/40">•</span> {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {log.data_used && Object.keys(log.data_used).length > 0 && (
                    <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" /> Dados processados:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(log.data_used).map(([key, val]) => (
                          <span key={key} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                            {key}: {String(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
