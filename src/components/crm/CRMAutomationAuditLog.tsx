import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { History, CheckCircle2, XCircle, RefreshCw, Eye } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AutomationLog {
  id: string;
  automation_name: string;
  status: string;
  created_at: string;
  error_message?: string | null;
  audit_context?: unknown;
  contact?: { first_name?: string | null; last_name?: string | null } | null;
}

export function CRMAutomationAuditLog() {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['crm-automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_automation_logs')
        .select(`
          *,
          contact:contacts(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    }
  });

  const reprocessEvent = useMutation({
    mutationFn: async (logId: string) => {
      // 1. Create reprocess entry
      const { error: queueError } = await supabase
        .from('crm_automation_reprocess_queue')
        .insert([{ log_id: logId, status: 'pending', next_retry_at: new Date().toISOString() }]);
      
      if (queueError) throw queueError;

      // 2. Update log status to show it was re-queued
      const { error: logUpdateError } = await supabase
        .from('crm_automation_logs')
        .update({ status: 'reprocessing' } as never)
        .eq('id', logId);
      
      if (logUpdateError) throw logUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-automation-logs'] });
      toast.success('Evento enfileirado para reprocessamento');
      setIsDetailsOpen(false);
    },
    onError: (error: Error) => toast.error(`Erro ao reprocessar: ${error.message}`)
  });

  const handleViewDetails = (log: AutomationLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  if (isLoading) return <div className="h-64 w-full animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Audit Log: Automações CRM
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase">Automação</TableHead>
                <TableHead className="text-[10px] uppercase">Contato</TableHead>
                <TableHead className="text-[10px] uppercase">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-right">Execução</TableHead>
                <TableHead className="text-[10px] uppercase text-right w-[80px]">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-medium">
                    {log.automation_name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.contact ? `${log.contact.first_name} ${log.contact.last_name}` : 'Sistema'}
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge variant="outline" className="text-[9px] gap-1 bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-2 w-2" /> Sucesso
                      </Badge>
                    ) : log.status === 'reprocessing' ? (
                      <Badge variant="outline" className="text-[9px] gap-1 bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
                        <RefreshCw className="h-2 w-2" /> Reprocessando
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] gap-1 bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-2 w-2" /> Falha
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground text-right tabular-nums">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewDetails(log as AutomationLog)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground italic">
                    Nenhum log de automação encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Detalhes da Execução
            </DialogTitle>
            <DialogDescription>
              Informações técnicas e contexto da automação CRM.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground uppercase text-[9px]">Automação</p>
                  <p className="font-semibold">{selectedLog.automation_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground uppercase text-[9px]">Data/Hora</p>
                  <p className="font-semibold">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground uppercase text-[9px]">Contato Vinculado</p>
                  <p className="font-semibold">{selectedLog.contact ? `${selectedLog.contact.first_name} ${selectedLog.contact.last_name}` : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground uppercase text-[9px]">ID da Execução</p>
                  <p className="font-mono text-[10px] truncate">{selectedLog.id}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-destructive uppercase mb-1">Erro Detectado</p>
                  <p className="text-xs text-destructive/80 font-mono leading-relaxed">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Contexto da Automação (JSON)</p>
                <ScrollArea className="h-32 rounded-md border bg-muted/30 p-2">
                  <pre className="text-[10px] font-mono leading-relaxed">
                    {JSON.stringify(selectedLog.audit_context || {}, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
                {selectedLog.status !== 'success' && selectedLog.status !== 'reprocessing' && (
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => reprocessEvent.mutate(selectedLog.id)}
                    disabled={reprocessEvent.isPending}
                  >
                    <RefreshCw className={reprocessEvent.isPending ? "animate-spin h-3 w-3" : "h-3 w-3"} />
                    Reprocessar Evento
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
