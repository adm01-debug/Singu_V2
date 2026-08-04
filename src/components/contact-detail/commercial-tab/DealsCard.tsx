import { useContactDeals } from '@/hooks/useContactDeals';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const stageColors: Record<string, string> = {
  prospeccao: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  qualificacao: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  proposta: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  negociacao: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  fechamento: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ganho: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  perdido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function DealsCard({ contactId }: Props) {
  const { data: deals, isLoading, error, refetch } = useContactDeals(contactId);
  const totalValue = deals?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
  const wonDeals = deals?.filter(d => d.status === 'ganho') || [];

  return (
    <ExternalDataCard title="Negócios" icon={<DollarSign className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!deals?.length} emptyMessage="Nenhum negócio vinculado">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Negócios</span>
            <Badge variant="outline" className="text-[10px]">{deals?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {totalValue > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Pipeline: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              {wonDeals.length > 0 && <Badge variant="outline" className="ml-auto text-[10px]">{wonDeals.length} ganho(s)</Badge>}
            </div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {deals?.map(deal => (
              <div key={deal.id} className="flex items-center justify-between p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{deal.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {deal.valor != null && <span className="text-[10px] text-muted-foreground">R$ {deal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                    {deal.previsao_fechamento && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{format(new Date(deal.previsao_fechamento), 'dd/MM/yy')}</span>}
                  </div>
                </div>
                {deal.pipeline_stage && <Badge className={`text-[9px] ml-2 ${stageColors[deal.pipeline_stage] || 'bg-muted text-muted-foreground'}`}>{deal.pipeline_stage}</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
