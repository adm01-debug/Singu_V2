import { useContactProposals } from '@/hooks/useContactProposals';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  viewed: { label: 'Visualizada', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  accepted: { label: 'Aceita', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

export function ProposalsCard({ contactId }: Props) {
  const { data: proposals, isLoading, error, refetch } = useContactProposals(contactId);

  return (
    <ExternalDataCard title="Propostas" icon={<FileText className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!proposals?.length} emptyMessage="Nenhuma proposta vinculada">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Propostas</span>
            <Badge variant="outline" className="text-[10px]">{proposals?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {proposals?.map(p => {
              const cfg = statusConfig[p.status || ''] || statusConfig.draft;
              return (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.value != null && <span className="text-[10px] text-muted-foreground">R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      <span className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), 'dd/MM/yy')}</span>
                    </div>
                  </div>
                  <Badge className={`text-[9px] ml-2 ${cfg.className}`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
