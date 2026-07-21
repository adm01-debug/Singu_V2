import { TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle } from 'lucide-react';
import { BestClosingMomentsCard } from './commercial-tab/BestClosingMomentsCard';
import { ChurnRiskCard } from './commercial-tab/ChurnRiskCard';
import { ClosingScoreCard } from './commercial-tab/ClosingScoreCard';
import { ClosingScoreAlertsCard } from './commercial-tab/ClosingScoreAlertsCard';
import { DealVelocityCard } from './commercial-tab/DealVelocityCard';
import { SatisfactionCard } from './commercial-tab/SatisfactionCard';
import { DealsLeadsPipelineCard } from './commercial-tab/DealsLeadsPipelineCard';
import { DealsCard } from './commercial-tab/DealsCard';
import { ProposalsCard } from './commercial-tab/ProposalsCard';
import { MeetingsCard } from './commercial-tab/MeetingsCard';
import { TasksCard } from './commercial-tab/TasksCard';
import { EmailLogsCard } from './commercial-tab/EmailLogsCard';
import { NpsCard } from './commercial-tab/NpsCard';
import { CadenceEnrollmentsCard } from './commercial-tab/CadenceEnrollmentsCard';
import { InactivityAlertsCard } from './commercial-tab/InactivityAlertsCard';
import { PurchaseHistoryElite } from '@/components/crm/commercial/PurchaseHistoryElite';
import { OfferSuggestionsElite } from '@/components/crm/commercial/OfferSuggestionsElite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import type { Tables } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

interface Props {
  contactId: string;
}

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function ContactCommercialTab({ contactId }: Props) {
  const { user } = useAuth();

  const { data, error, refetch } = useQuery({
    queryKey: ['contact-commercial', contactId, user?.id],
    queryFn: async () => {
      const contactFilter = [
        { type: 'eq' as const, column: 'contact_id', value: contactId },
        { type: 'eq' as const, column: 'user_id', value: user?.id ?? '' },
      ];

      // Try local first, then external
      const [rfmLocal, purchaseLocal] = await Promise.all([
        supabase.from('rfm_analysis').select('*').eq('contact_id', contactId).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1),
        supabase.from('purchase_history').select('*').eq('contact_id', contactId).eq('user_id', user!.id).order('purchase_date', { ascending: false }).limit(20),
      ]);

      let rfm = rfmLocal.data?.[0] || null;
      let purchases = purchaseLocal.data || [];

      // Fallback to external if empty
      if (!rfm) {
        const { data: extRfm } = await queryExternalData<Tables<'rfm_analysis'>>({
          table: 'rfm_analysis', filters: contactFilter,
          order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 0 },
        });
        if (Array.isArray(extRfm) && extRfm.length > 0) rfm = extRfm[0];
      }

      if (purchases.length === 0) {
        const { data: extPurchases } = await queryExternalData<Tables<'purchase_history'>>({
          table: 'purchase_history', filters: contactFilter,
          order: { column: 'purchase_date', ascending: false }, range: { from: 0, to: 19 },
        });
        if (Array.isArray(extPurchases)) purchases = extPurchases;
      }

      return { rfm, purchases };
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const rfm = data?.rfm || null;

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">Erro ao carregar dados comerciais</p>
            <p className="text-xs text-muted-foreground mt-1">
              {parseApiError(error, 'Tente novamente em alguns instantes')}
            </p>
          </div>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">Tentar novamente</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Intelligence from external views */}
      <BestClosingMomentsCard contactId={contactId} />
      <ChurnRiskCard contactId={contactId} />
      <ClosingScoreCard contactId={contactId} />
      <ClosingScoreAlertsCard contactId={contactId} />
      <DealVelocityCard contactId={contactId} />
      <SatisfactionCard contactId={contactId} />

      {/* New commercial cards */}
      <DealsCard contactId={contactId} />
      <ProposalsCard contactId={contactId} />
      <MeetingsCard contactId={contactId} />
      <TasksCard contactId={contactId} />
      <EmailLogsCard contactId={contactId} />
      <NpsCard contactId={contactId} />
      <CadenceEnrollmentsCard contactId={contactId} />
      <InactivityAlertsCard contactId={contactId} />

      {/* Deals & Leads Pipeline — full-width */}
      <div className="md:col-span-2">
        <DealsLeadsPipelineCard contactId={contactId} />
      </div>

      {/* RFM Analysis */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Análise RFM
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rfm ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  className="text-sm px-3 py-1"
                  style={{ backgroundColor: rfm.segment_color || undefined }}
                >
                  {rfm.segment}
                </Badge>
                {rfm.segment_description && (
                  <span className="text-xs text-muted-foreground">{rfm.segment_description}</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Recência', score: rfm.recency_score, trend: rfm.recency_trend },
                  { label: 'Frequência', score: rfm.frequency_score, trend: rfm.frequency_trend },
                  { label: 'Monetário', score: rfm.monetary_score, trend: rfm.monetary_trend },
                ].map(({ label, score, trend }) => {
                  const TrendIcon = TREND_ICONS[trend] || Minus;
                  return (
                    <div key={label} className="text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-2xl font-bold text-foreground">{score}</span>
                        <TrendIcon className={cn('h-4 w-4',
                          trend === 'up' ? 'text-success' :
                          trend === 'down' ? 'text-destructive' :
                          'text-muted-foreground'
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {rfm.total_monetary_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.total_monetary_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {rfm.total_purchases != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Total Compras</p>
                    <p className="font-semibold text-foreground">{rfm.total_purchases}</p>
                  </div>
                )}
                {rfm.average_order_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Ticket Médio</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.average_order_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {rfm.predicted_lifetime_value != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">LTV Previsto</p>
                    <p className="font-semibold text-foreground">
                      R$ {Number(rfm.predicted_lifetime_value).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {rfm.churn_probability != null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Probabilidade de Churn
                    </span>
                    <span className={cn('text-xs font-medium',
                      Number(rfm.churn_probability) > 70 ? 'text-destructive' :
                      Number(rfm.churn_probability) > 40 ? 'text-accent' :
                      'text-success'
                    )}>
                      {Number(rfm.churn_probability)}%
                    </span>
                  </div>
                  <Progress value={Number(rfm.churn_probability)} className="h-2" />
                </div>
              )}

              {rfm.communication_priority && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Prioridade de comunicação:</span>
                  <Badge variant="outline" className="text-xs capitalize">{rfm.communication_priority}</Badge>
                </div>
              )}
            </div>
          ) : (
            <InlineEmptyState
              icon={BarChart3}
              title="Análise RFM pendente"
              description="Execute a análise para segmentar este contato por Recência, Frequência e Valor"
            />
          )}
        </CardContent>
      </Card>

      {/* Advanced Commercial Intelligence */}
      <div className="md:col-span-2 grid gap-4 lg:grid-cols-2">
        <OfferSuggestionsElite contactId={contactId} />
        <PurchaseHistoryElite contactId={contactId} />
      </div>
    </div>
  );
}
