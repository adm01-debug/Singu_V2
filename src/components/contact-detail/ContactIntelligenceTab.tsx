import { lazy, Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import { EmotionalAnchorsPanel } from '@/components/contact-detail/EmotionalAnchorsPanel';
import { BestTimeToContactCard } from '@/components/contact-detail/BestTimeToContactCard';
import { AIActionsPanel } from '@/components/contact-detail/AIActionsPanel';
import { SocialIntelligencePanel } from '@/components/contact-detail/SocialIntelligencePanel';
import { ScoreHistoryPanel } from '@/components/contact-detail/ScoreHistoryPanel';
import { ContactTimeHeatmap } from '@/components/contact-detail/ContactTimeHeatmap';
 import { WorkspaceAccountsCard } from '@/components/contact-detail/WorkspaceAccountsCard';
import { Skeleton } from '@/components/ui/skeleton';
const ChurnRiskWidget = lazy(() => import('./ChurnRiskWidget'));
const ChurnPredictionsWidget = lazy(() => import('./ChurnPredictionsWidget'));
const ContactDaysWithoutWidget = lazy(() => import('./ContactDaysWithoutWidget'));
const CRMAlertsWidget = lazy(() => import('./CRMAlertsWidget').then(m => ({ default: m.CRMAlertsWidget })));
const LocalChurnRiskPanel = lazy(() => import('@/components/churn-risk/ChurnRiskPanel'));

import { LeadScoreWidget } from '@/components/lead-score/LeadScoreWidget';
import { ScoreExplicabilityPanel } from './ScoreExplicabilityPanel';
import { MetricOverrideFlow } from './MetricOverrideFlow';
 import { RelationshipAuditPanel } from '../crm/relationship/RelationshipAuditPanel';
 import { EmotionalIntelligencePanel } from '@/components/analytics/EmotionalIntelligencePanel';
import { ClientValuesElite } from '@/components/crm/commercial/ClientValuesElite';
import { DecisionCriteriaElite } from '@/components/crm/commercial/DecisionCriteriaElite';


 interface Props {
   contactId: string;
   contactName?: string;
   linkedinUrl?: string | null;
   websiteUrl?: string | null;
   currentScore?: number;
   currentSentiment?: string;
   interactions?: any[];
 }
 
 export function ContactIntelligenceTab({ 
   contactId, 
   contactName, 
   linkedinUrl, 
   websiteUrl, 
   currentScore = 0, 
   currentSentiment = 'neutral',
   interactions = []
 }: Props) {
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
         <EmotionalIntelligencePanel 
           contact={{ id: contactId, firstName: contactName || 'Contato' } as any} 
           interactions={interactions} 
         />
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

      {/* Decision Criteria & Client Values Elite */}
      <div className="space-y-4">
        <DecisionCriteriaElite contactId={contactId} />
        <ClientValuesElite contactId={contactId} />
      </div>
      </div>

      {/* Explicability & Control */}
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreExplicabilityPanel contactId={contactId} />
        <MetricOverrideFlow 
          contactId={contactId} 
          currentScore={currentScore} 
          currentSentiment={currentSentiment} 
        />
      </div>

      <RelationshipAuditPanel contactId={contactId} />




      {/* Social Intelligence */}

      <SocialIntelligencePanel contactId={contactId} />

        {/* Communication Preferences + Score History */}
        <div className="grid gap-4 md:grid-cols-2">
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
        currentScore={currentScore}
        currentSentiment={currentSentiment}
      />

    </div>
  );
}
