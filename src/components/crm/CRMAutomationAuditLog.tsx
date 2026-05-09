import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
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

export function CRMAutomationAuditLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['crm-automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_automation_logs')
        .select(`
          *,
          contact:contacts(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div className="h-64 w-full animate-pulse bg-muted rounded-lg" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Audit Log: Automações CRM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase">Automação</TableHead>
              <TableHead className="text-[10px] uppercase">Contato</TableHead>
              <TableHead className="text-[10px] uppercase">Status</TableHead>
              <TableHead className="text-[10px] uppercase text-right">Execução</TableHead>
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
                  ) : (
                    <Badge variant="outline" className="text-[9px] gap-1 bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-2 w-2" /> Falha
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground text-right tabular-nums">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
