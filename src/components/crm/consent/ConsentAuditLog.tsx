import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Clock, ShieldAlert, Globe, MessageSquare, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  contactId: string;
}

export function ConsentAuditLog({ contactId }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["consent-audit-logs", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_consent_audit_logs")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const getIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp": return <MessageSquare className="h-3 w-3" />;
      case "email": return <Mail className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Log de Auditoria de Consentimento (LGPD)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!logs || logs.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground italic">
            Nenhum registro de consentimento encontrado.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/10">
                <div className={`mt-0.5 rounded-full p-1.5 ${log.status === 'granted' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {log.status === 'granted' ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{log.consent_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={log.status === 'granted' ? 'success' : 'destructive'} className="text-[9px] px-1 h-4">
                      {log.status === 'granted' ? 'Autorizado' : 'Revogado'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1 h-4 gap-1">
                      {getIcon(log.platform || '')}
                      {log.platform || 'Geral'}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">Origem: {log.source}</span>
                  </div>
                  {log.ip_address && (
                    <p className="text-[9px] text-muted-foreground font-mono">IP: {log.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}