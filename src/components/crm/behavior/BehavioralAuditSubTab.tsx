import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, AlertTriangle, Clock, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useContactBehavior } from "@/hooks/useContactBehavior";
import { useNLPAnalysisValidation } from "@/hooks/useNLPAnalysisValidation";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BehavioralAuditSubTabProps {
  contactId: string;
}

export const BehavioralAuditSubTab = ({ contactId }: BehavioralAuditSubTabProps) => {
  const { auditLogs, gaps, consistency, isLoading } = useContactBehavior(contactId);
  const { validateVAK, validateMetaprogram } = useNLPAnalysisValidation();

  if (isLoading) return <div className="p-8 text-center">Carregando auditoria...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: Gaps and Consistency */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Gaps de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gaps && gaps.length > 0 ? (
              <ul className="space-y-3">
                {gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-md">
                    <Badge variant={gap.priority === 'high' ? 'destructive' : 'secondary'} className="mt-0.5 text-[10px]">
                      {gap.priority}
                    </Badge>
                    <div>
                      <span className="font-semibold">{gap.category}:</span> {gap.field_name}
                      <p className="text-xs text-muted-foreground">{gap.issue_type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum gap crítico encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Consistência
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consistency?.is_consistent ? (
              <div className="p-3 bg-success/10 text-success rounded-md flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Dados consistentes
              </div>
            ) : (
              <div className="space-y-2">
                {consistency?.issues.map((issue, idx) => (
                  <div key={idx} className="p-2 bg-destructive/10 text-destructive rounded-md text-xs flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 mt-0.5" />
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main: Audit Logs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-muted pb-4 last:pb-0">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {format(new Date(log.timestamp), "PPp", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {log.change_source || 'sistema'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <User className="h-3 w-3" />
                        {log.user_email || 'Sistema/IA'}
                      </div>
                      <p className="text-sm mt-1">{log.reason}</p>
                      {log.analysis_type && !log.is_validated && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Validar Análise:</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:text-success"
                            onClick={() => log.analysis_type === "vak" ? validateVAK(log.id, true) : validateMetaprogram(log.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:text-destructive"
                            onClick={() => log.analysis_type === "vak" ? validateVAK(log.id, false) : validateMetaprogram(log.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-muted/30 rounded text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1">De:</span>
                           <code className="block truncate">{log.old_value != null ? String(log.old_value) : '-'}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Para:</span>
                           <code className="block truncate">{log.new_value != null ? String(log.new_value) : '-'}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma alteração registrada.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
