import { lazy, Suspense } from 'react';
import { AlertTriangle, Target, Heart, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import { EmotionalAnchorsPanel } from '@/components/contact-detail/EmotionalAnchorsPanel';
import { BestTimeToContactCard } from '@/components/contact-detail/BestTimeToContactCard';
import { AIActionsPanel } from '@/components/contact-detail/AIActionsPanel';
import { SocialIntelligencePanel } from '@/components/contact-detail/SocialIntelligencePanel';
import { ScoreHistoryPanel } from '@/components/contact-detail/ScoreHistoryPanel';
import { ContactTimeHeatmap } from '@/components/contact-detail/ContactTimeHeatmap';
import { CommunicationPreferencesCard } from '@/components/contact-detail/CommunicationPreferencesCard';
import { WorkspaceAccountsCard } from '@/components/contact-detail/WorkspaceAccountsCard';
import type { Tables } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
const ChurnRiskWidget = lazy(() => import('./ChurnRiskWidget'));
const ChurnPredictionsWidget = lazy(() => import('./ChurnPredictionsWidget'));
const ContactDaysWithoutWidget = lazy(() => import('./ContactDaysWithoutWidget'));
const CRMAlertsWidget = lazy(() => import('./CRMAlertsWidget').then(m => ({ default: m.CRMAlertsWidget })));
const LocalChurnRiskPanel = lazy(() => import('@/components/churn-risk/ChurnRiskPanel'));

import { LeadScoreWidget } from '@/components/lead-score/LeadScoreWidget';
import { ScoreExplicabilityPanel } from './ScoreExplicabilityPanel';
import { MetricOverrideFlow } from './MetricOverrideFlow';


interface Props {
  contactId: string;
  contactName?: string;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export function ContactIntelligenceTab({ contactId, contactName, linkedinUrl, websiteUrl }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['contact-intelligence', contactId, user?.id],
    queryFn: async () => {
      const [objRes, critRes, valRes, offRes] = await Promise.all([
        supabase.from('hidden_objections').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('decision_criteria').select('*').eq('contact_id', contactId).order('priority', { ascending: false }),
        supabase.from('client_values').select('*').eq('contact_id', contactId).order('importance', { ascending: false }),
        supabase.from('offer_suggestions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      ]);

      return {
        objections: objRes.data || [],
        criteria: critRes.data || [],
        values: valRes.data || [],
        offers: offRes.data || [],
      };
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const updateOfferStatus = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: string }) => {
      const { error } = await supabase
        .from('offer_suggestions')
        .update({ status })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-intelligence', contactId] });
      toast.success('Status da oferta atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const objections = data?.objections || [];
  const criteria = data?.criteria || [];
  const values = data?.values || [];
  const offers = data?.offers || [];
  const unresolvedObjections = objections.filter(o => !o.resolved);

  return (
    <div className="space-y-4">
      <Suspense fallback={<Skeleton className="h-20" />}>
        <CRMAlertsWidget contactId={contactId} />
      </Suspense>

      <div className="flex justify-end">
        <ModuleHelp {...moduleHelpContent.neuromarketing} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      {/* Hidden Objections */}
      <Card className={cn(unresolvedObjections.length > 0 && 'border-accent/30 dark:border-accent/30')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-accent" />
            Objeções Ocultas ({unresolvedObjections.length} ativas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unresolvedObjections.length > 0 ? (
            <div className="space-y-2">
              {unresolvedObjections.map((obj) => (
                <div key={obj.id} className="rounded-lg border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{obj.objection_type}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs',
                        obj.severity === 'high' ? 'text-destructive border-destructive' :
                        obj.severity === 'medium' ? 'text-accent border-accent/30' :
                        'text-muted-foreground'
                      )}
                    >
                      {obj.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{obj.indicator}</p>
                  {obj.possible_real_objection && (
                    <p className="text-xs text-foreground mt-1">
                      <strong>Provável:</strong> {obj.possible_real_objection}
                    </p>
                  )}
                  {obj.suggested_probe && (
                    <p className="text-xs text-primary mt-1">
                      💡 {obj.suggested_probe}
                    </p>
                  )}
                  {obj.probability && (
                    <Progress value={obj.probability} className="h-1.5 mt-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyState icon={AlertTriangle} title="Nenhuma objeção detectada" description="A IA identificará objeções ocultas conforme interações são analisadas" />
          )}
        </CardContent>
      </Card>

      {/* Decision Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            Critérios de Decisão ({criteria.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criteria.length > 0 ? (
            <div className="space-y-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.criteria_type}</p>
                    {c.how_to_address && (
                      <p className="text-xs text-primary mt-1">→ {c.how_to_address}</p>
                    )}
                    {c.detected_from && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Fonte: {c.detected_from}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">P{c.priority || 1}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyState icon={Target} title="Sem critérios registrados" description="Critérios de decisão serão detectados automaticamente" />
          )}
        </CardContent>
      </Card>

      {/* Client Values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-primary" />
            Valores do Cliente ({values.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {values.length > 0 ? (
            <div className="space-y-2">
              {values.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{v.value_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category}</p>
                    {v.detected_phrases && v.detected_phrases.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.detected_phrases.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground/60 italic">"{p}"</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Importância: {v.importance}/10</span>
                    {(v.frequency ?? 0) > 1 && (
                      <p className="text-xs text-muted-foreground">Mencionado {v.frequency}x</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyState icon={Heart} title="Nenhum valor detectado" description="Valores serão identificados nas conversas" />
          )}
        </CardContent>
      </Card>

      {/* Offer Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-success" />
            Sugestões de Oferta ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offers.length > 0 ? (
            <div className="space-y-2">
              {offers.map((o) => {
                return (
                  <div key={o.id} className="rounded-lg border p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground flex-1">{o.offer_name}</p>
                      <Select
                        value={o.status || 'pending'}
                        onValueChange={(val) => updateOfferStatus.mutate({ offerId: o.id, status: val })}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ Pendente</SelectItem>
                          <SelectItem value="presented">📋 Apresentada</SelectItem>
                          <SelectItem value="accepted">✅ Aceita</SelectItem>
                          <SelectItem value="rejected">❌ Rejeitada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{o.reason}</p>
                    {o.confidence_score && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={o.confidence_score} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{o.confidence_score}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <InlineEmptyState icon={Gift} title="Sem sugestões de oferta" description="Use o painel de IA para gerar sugestões personalizadas" />
          )}
        </CardContent>
      </Card>
      </div>

      {/* Explicability & Control */}
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreExplicabilityPanel contactId={contactId} />
        <MetricOverrideFlow 
          contactId={contactId} 
          currentScore={data?.objections?.[0]?.contact?.relationship_score || 0} 
          currentSentiment={data?.objections?.[0]?.contact?.sentiment || 'neutral'} 
        />
      </div>

      {/* Social Intelligence */}

      <SocialIntelligencePanel contactId={contactId} />

      {/* Communication Preferences + Score History */}
      <div className="grid gap-4 md:grid-cols-2">
        <CommunicationPreferencesCard contactId={contactId} />
        <ScoreHistoryPanel contactId={contactId} />
        <WorkspaceAccountsCard contactId={contactId} />
      </div>

      {/* New panels: Emotional Anchors, Best Time, AI Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <ContactTimeHeatmap contactId={contactId} />
        <LeadScoreWidget contactId={contactId} />
        <EmotionalAnchorsPanel contactId={contactId} />
        <BestTimeToContactCard contactId={contactId} />
        <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
          <ChurnRiskWidget contactId={contactId} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-28 rounded-lg" />}>
          <ChurnPredictionsWidget contactId={contactId} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
          <LocalChurnRiskPanel contactId={contactId} compact />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-12 rounded-lg" />}>
        <ContactDaysWithoutWidget contactId={contactId} />
      </Suspense>

      <AIActionsPanel
        contactId={contactId}
        contactName={contactName || 'Contato'}
        linkedinUrl={linkedinUrl}
        websiteUrl={websiteUrl}
      />
    </div>
  );
}
