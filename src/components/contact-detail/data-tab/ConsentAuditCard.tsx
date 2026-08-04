import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Calendar, Globe, Network, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ConsentAuditCard({ contactId }: { contactId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['social-consent-audit', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_consent_audit')
        .select('id, consent_type, contact_id, created_at, ip_address, network, source_url, user_agent, user_id')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Log de Auditoria de Consentimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="text-xs p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {log.consent_type || 'Geral'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Network className="h-3 w-3 text-primary" />
                    <span className="font-semibold">Rede:</span>
                    <span>{log.network || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-primary" />
                    <span className="font-semibold">Origem:</span>
                    <span className="truncate">{log.source_url || 'Dashboard'}</span>
                  </div>
                </div>

                {log.ip_address && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>IP: {log.ip_address}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Nenhum registro de consentimento encontrado.</p>
            </div>
          )}
          
          <p className="text-[10px] text-muted-foreground italic border-t pt-2">
            Este log mantém a rastreabilidade e conformidade com as políticas de privacidade.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}