import { DollarSign, TrendingUp, Clock, Target, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useDealsFullView } from '@/hooks/useDealsFullView';
import { useLeadsFullView } from '@/hooks/useLeadsFullView';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

function formatCurrency(val: number | null) {
  if (val == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
}

const PRIORITY_COLORS: Record<string, string> = {
  alta: 'text-destructive', media: 'text-warning', baixa: 'text-muted-foreground',
  high: 'text-destructive', medium: 'text-warning', low: 'text-muted-foreground',
};

const TEMP_COLORS: Record<string, string> = {
  quente: 'bg-destructive/10 text-destructive', morno: 'bg-warning/10 text-warning', frio: 'bg-info/10 text-info',
  hot: 'bg-destructive/10 text-destructive', warm: 'bg-warning/10 text-warning', cold: 'bg-info/10 text-info',
};

export function DealsLeadsPipelineCard({ contactId }: Props) {
  const { data: deals = [], isLoading: dealsLoading, error: dealsError, refetch: refetchDeals } = useDealsFullView(contactId);
  const { data: leads = [], isLoading: leadsLoading, error: leadsError, refetch: refetchLeads } = useLeadsFullView(contactId);

  const isLoading = dealsLoading || leadsLoading;
  const error = dealsError || leadsError;
  const refetch = () => { refetchDeals(); refetchLeads(); };

  return (
    <ExternalDataCard
      title="Pipeline de Deals & Leads"
      icon={<DollarSign className="h-4 w-4 text-success" />}
      isLoading={isLoading}
      error={error}
      hasData={deals.length > 0 || leads.length > 0}
      emptyMessage="Nenhum deal ou lead encontrado"
      onRetry={refetch}
    >
      <div className="space-y-4">
        {deals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  Pipeline de Deals
                </div>
                <Badge variant="secondary" className="text-[10px]">{deals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-2">
                  {deals.map((deal) => (
                    <div key={deal.id} className="rounded-lg border p-3 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {deal.titulo || deal.codigo || 'Deal sem título'}
                          </p>
                          {deal.pipeline_nome && (
                            <p className="text-muted-foreground">
                              {deal.pipeline_nome}
                              {deal.stage_nome && (<> <ArrowRight className="h-2.5 w-2.5 inline" /> <span className="font-medium">{deal.stage_nome}</span></>)}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-success">{formatCurrency(deal.valor_final || deal.valor)}</p>
                          {deal.probabilidade != null && <p className="text-muted-foreground">{deal.probabilidade}% prob.</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {deal.status && <Badge variant="outline" className="text-[9px] capitalize">{deal.status}</Badge>}
                        {deal.prioridade && <Badge variant="outline" className={cn('text-[9px]', PRIORITY_COLORS[deal.prioridade] || '')}>{deal.prioridade}</Badge>}
                        {deal.dias_no_pipeline != null && (
                          <span className="flex items-center gap-0.5 text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />{deal.dias_no_pipeline}d no pipeline
                          </span>
                        )}
                      </div>
                      {deal.proximos_passos && (
                        <p className="text-muted-foreground bg-muted/50 rounded p-1.5">
                          <Target className="h-2.5 w-2.5 inline mr-0.5" />{deal.proximos_passos}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {leads.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-info" />
                  Pipeline de Leads
                </div>
                <Badge variant="secondary" className="text-[10px]">{leads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="rounded-lg border p-3 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{lead.contato_nome || lead.codigo || 'Lead sem nome'}</p>
                          {lead.pipeline_nome && (
                            <p className="text-muted-foreground">
                              {lead.pipeline_nome}
                              {lead.stage_nome && (<> <ArrowRight className="h-2.5 w-2.5 inline" /> <span className="font-medium">{lead.stage_nome}</span></>)}
                            </p>
                          )}
                          {lead.empresa_nome && <p className="text-muted-foreground">{lead.empresa_nome}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {lead.valor_estimado != null && <p className="font-bold text-info">{formatCurrency(lead.valor_estimado)}</p>}
                          {lead.score != null && <p className="text-muted-foreground">Score: {lead.score}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead.status && <Badge variant="outline" className="text-[9px] capitalize">{lead.status}</Badge>}
                        {lead.temperatura && <Badge className={cn('text-[9px]', TEMP_COLORS[lead.temperatura] || '')} variant="outline">🌡 {lead.temperatura}</Badge>}
                        {lead.prioridade && <Badge variant="outline" className={cn('text-[9px]', PRIORITY_COLORS[lead.prioridade] || '')}>{lead.prioridade}</Badge>}
                        {lead.campanha && <span className="flex items-center gap-0.5 text-muted-foreground"><Tag className="h-2.5 w-2.5" /> {lead.campanha}</span>}
                        {lead.source_nome && <span className="text-muted-foreground">via {lead.source_nome}</span>}
                      </div>
                      {lead.interesse && <p className="text-muted-foreground bg-muted/50 rounded p-1.5">{lead.interesse}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </ExternalDataCard>
  );
}
