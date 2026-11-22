import { lazy, Suspense, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
 import { PersonalityExecutiveSummary } from './behavioral-tab/PersonalityExecutiveSummary';
 import { NeuroEvolutionChart } from './NeuroEvolutionChart';
import { RelationshipScoreChart } from './behavioral-tab/RelationshipScoreChart';
import { DiscCompatibilityCard } from './behavioral-tab/DiscCompatibilityCard';
import { RapportCard } from './behavioral-tab/RapportCard';
import { EmotionalTrendCard } from './behavioral-tab/EmotionalTrendCard';
import { CommunicationDashboardCard } from './behavioral-tab/CommunicationDashboardCard';
import { EqEvolutionCard } from './behavioral-tab/EqEvolutionCard';
import { EqDashboardCard } from './behavioral-tab/EqDashboardCard';
import { DiscSubTab } from './behavioral-tab/DiscSubTab';
import { VakSubTab } from './behavioral-tab/VakSubTab';
import { EqSubTab } from './behavioral-tab/EqSubTab';
import { BiasesSubTab } from './behavioral-tab/BiasesSubTab';
import { MetaprogramsSubTab } from './behavioral-tab/MetaprogramsSubTab';
 import { PersonalitySubTab } from './behavioral-tab/PersonalitySubTab';
 import { SleightOfMouthPanel } from '@/components/nlp/SleightOfMouthPanel';
import { MotivationsSubTab } from './behavioral-tab/MotivationsSubTab';
import { DecisionMakingSubTab } from './behavioral-tab/DecisionMakingSubTab';
import { InfluencersSubTab } from './behavioral-tab/InfluencersSubTab';
import { BusinessContextSubTab } from './behavioral-tab/BusinessContextSubTab';
import { BehavioralAuditSubTab } from '../crm/behavior/BehavioralAuditSubTab';
 import { PredictiveRoadmap } from '../crm/behavior/PredictiveRoadmap';
import { BehavioralExecutiveSummary } from './behavioral-tab/BehavioralExecutiveSummary';
import { ApproachRecommendationPanel } from '@/components/analytics/ApproachRecommendationPanel';
import { CognitiveBiasesPanel } from '@/components/analytics/CognitiveBiasesPanel';
import { ClientHealthPanel } from '@/components/analytics/ClientHealthPanel';
import { SmartTemplateSuggestions } from '@/components/triggers/SmartTemplateSuggestions';
import { TemplatePerformanceComparison } from '@/components/triggers/TemplatePerformanceComparison';
import { useDashboardMappedData } from '@/hooks/useDashboardMappedData';
import { getBehavior } from '@/types/behavior';
import type {
  Contact as LegacyContact,
  ContactBehavior,
  ContactRole,
  RelationshipStage,
  SentimentType,
} from '@/types';
import { ContactFamilyInterestsCard } from './behavioral-tab/ContactFamilyInterestsCard';
import { RapportStrategySubTab } from './behavioral-tab/RapportStrategySubTab';
import { NeuroDominanceTab } from './behavioral-tab/NeuroDominanceTab';
import { ConsentAuditLog } from '@/components/crm/consent/ConsentAuditLog';
import { RelationshipReportExport } from '@/components/crm/relationship/RelationshipReportExport';
import { ProfileBasedSuggestions } from '@/components/triggers/ProfileBasedSuggestions';
import { CompatibilityScore } from '@/components/triggers/CompatibilityScore';
import { TemplateHistoryByProfile } from '@/components/triggers/TemplateHistoryByProfile';
import { useFicha360NLP } from '@/hooks/useFicha360NLP';
import { NeuroDecisionPath, NeuroScore, NeuroAlerts, NeuroObjectionHandler, NeuroCompatibilityAnalysis } from '@/components/neuromarketing';
const CommunicationIntelWidget = lazy(() => import('./CommunicationIntelWidget'));
const EmotionalTrendWidget = lazy(() => import('./EmotionalTrendWidget'));
const EmotionalTrendByContactWidget = lazy(() => import('./EmotionalTrendByContactWidget'));
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISCCommunicationLogsPanel } from '@/components/contact-detail/DISCCommunicationLogsPanel';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import type { Tables } from '@/integrations/supabase/types';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import type { Contact } from '@/hooks/useContactDetail';

 interface Props {
   contact: Contact;
   interactions?: Tables<'interactions'>[];
 }
 
 async function fetchWithFallback<T>(
   localFn: () => Promise<{ data: T | null; error: unknown }>,
   extTable: string,
   filters: Array<{ type: 'eq'; column: string; value: string }>,
   options?: { order?: { column: string; ascending?: boolean }; range?: { from: number; to: number } },
 ): Promise<T | null> {
   const { data: local } = await localFn();
   if (local && (Array.isArray(local) ? local.length > 0 : true)) return local;
   const { data: ext } = await queryExternalData<T>({ table: extTable, filters, ...options });
   if (Array.isArray(ext) && ext.length > 0) return ext as unknown as T;
   if (ext && !Array.isArray(ext)) return ext as unknown as T;
   return Array.isArray(local) ? ([] as unknown as T) : null;
 }
 
 export function ContactBehavioralTab({ contact, interactions = [] }: Props) {
   const { user } = useAuth();
   const { vakProfile, metaprogramProfile } = useFicha360NLP(contact.id);
  // O painel de Abordagem IA consome o modelo de dominio legado (Contact de @/types),
  // que difere do shape cru de `contacts`. Mapeamos apenas o que os hooks leem,
  // sem validadores que possam lancar durante o render.
  const panelContact = useMemo((): LegacyContact | null => {
    if (!contact) return null;
    const typedBehavior = getBehavior(contact.behavior) as ContactBehavior | null;
    const lastInteraction = contact.last_interaction_at ? new Date(contact.last_interaction_at) : undefined;
    const daysSinceContact = lastInteraction && !Number.isNaN(lastInteraction.getTime())
      ? Math.floor((Date.now() - lastInteraction.getTime()) / 86_400_000)
      : undefined;
    return {
      id: contact.id,
      companyId: contact.company_id ?? '',
      companyName: '',
      firstName: contact.first_name ?? '',
      lastName: contact.last_name ?? '',
      role: (contact.role as ContactRole) ?? 'contact',
      roleTitle: contact.role_title ?? '',
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      tags: contact.tags ?? [],
      hobbies: contact.hobbies ?? [],
      interests: contact.interests ?? [],
      relationshipStage: (contact.relationship_stage as RelationshipStage) ?? 'unknown',
      relationshipScore: contact.relationship_score ?? 0,
      interactionCount: interactions.length,
      lastInteraction,
      daysSinceContact,
      sentiment: (contact.sentiment as SentimentType) ?? 'neutral',
      behavior: typedBehavior ?? ({ discProfile: null, discConfidence: 0 } as unknown as ContactBehavior),
      lifeEvents: [],
      createdAt: contact.created_at ? new Date(contact.created_at) : new Date(0),
      updatedAt: contact.updated_at ? new Date(contact.updated_at) : new Date(0),
    } as LegacyContact;
  }, [contact, interactions]);
  const panelInteractions = useMemo(
    () => interactions.map(i => ({
      id: i.id,
      content: i.content ?? undefined,
      transcription: i.transcription ?? undefined,
      createdAt: i.created_at ?? undefined,
    })),
    [interactions],
  );
  const { mappedInteractions } = useDashboardMappedData([], [], interactions, true);
  const neuroInteractions = useMemo(
    () => panelInteractions
      .filter((i): i is typeof i & { content: string } => typeof i.content === 'string' && i.content.length > 0)
      .map(i => ({ content: i.content, transcription: i.transcription, created_at: i.createdAt })),
    [panelInteractions],
  );
  const behavior = contact.behavior as Record<string, unknown> | null;

  const { data: behavioralData } = useQuery({
    queryKey: ['contact-behavioral', contact.id, user?.id],
    queryFn: async () => {
      const contactFilter = [
        { type: 'eq' as const, column: 'contact_id', value: contact.id },
        { type: 'eq' as const, column: 'user_id', value: user?.id ?? '' },
      ];

      const [discRes, eqRes, biasRes, metaRes] = await Promise.all([
        fetchWithFallback<Tables<'disc_analysis_history'>[]>(
          async () => supabase.from('disc_analysis_history').select('*').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(5),
          'disc_analysis_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 4 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('eq_analysis_history').select('*').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1),
          'eq_analysis_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('cognitive_bias_history').select('*').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1),
          'cognitive_bias_history', contactFilter,
          { order: { column: 'analyzed_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
        fetchWithFallback<Record<string, unknown>[]>(
          async () => supabase.from('metaprogram_analysis').select('*').eq('contact_id', contact.id).eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1),
          'metaprogram_analysis', contactFilter,
          { order: { column: 'created_at', ascending: false }, range: { from: 0, to: 0 } },
        ),
      ]);

      return {
        discHistory: (discRes as unknown as Tables<'disc_analysis_history'>[]) || [],
        eqAnalysis: (eqRes as Record<string, unknown>[])?.[0] as {
          overall_score?: number; overall_level?: string; profile_summary?: string;
          pillar_scores?: Record<string, number>; strengths?: string[];
          areas_for_growth?: string[]; sales_implications?: Record<string, unknown>;
        } | null || null,
        biases: (biasRes as Record<string, unknown>[])?.[0] as {
          dominant_biases?: string[]; vulnerabilities?: string[]; resistances?: string[];
          profile_summary?: string; category_distribution?: Record<string, number>;
          sales_strategies?: Record<string, unknown>;
        } | null || null,
        metaprograms: (metaRes as Record<string, unknown>[])?.[0] as {
          toward_score?: number; away_from_score?: number; internal_score?: number;
          external_score?: number; options_score?: number; procedures_score?: number;
        } | null || null,
      };
    },
    enabled: !!contact.id && !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });

  const eqAnalysis = behavioralData?.eqAnalysis || null;
  const biases = behavioralData?.biases || null;

  const { data: salespersonDisc } = useQuery({
    queryKey: ['salesperson-disc', user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('nlp_profile').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      const raw = data?.nlp_profile as { discProfile?: string } | null;
      const value = raw?.discProfile;
      return value === 'D' || value === 'I' || value === 'S' || value === 'C' ? value : null;
    },
  });

  const discProfile = behavior?.discProfile as string | null;
  const discConfidence = (behavior?.discConfidence as number) || 0;

   return (
     <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
           <PersonalityExecutiveSummary contactId={contact.id} />
         </div>
         <div className="lg:col-span-1">
           <NeuroEvolutionChart contactId={contact.id} />
         </div>
       </div>
      <BehavioralExecutiveSummary 
        contactId={contact.id} 
        data={{
          disc: discProfile || (behavior?.discProfile as string),
          discConfidence: discConfidence,
          eqScore: eqAnalysis?.overall_score,
          eqLevel: eqAnalysis?.overall_level,
          primaryVak: (behavior?.vakProfile as { primary?: string } | null | undefined)?.primary || 'Auditivo',
          summary: eqAnalysis?.profile_summary || biases?.profile_summary,
          strengths: eqAnalysis?.strengths,
          riskFactors: biases?.resistances,
          approachStrategy: (biases?.sales_strategies as { primary_approach?: string } | null | undefined)?.primary_approach
        }}
      />
      <ContactFamilyInterestsCard 
        contactId={contact.id}
        hobbies={contact.hobbies as string[]}
        interests={contact.interests as string[]}
        familyInfo={contact.family_info || undefined}
        onUpdate={async (data) => {
          if (!user) throw new Error('Não autenticado');
          const { error } = await supabase.from('contacts').update(data).eq('id', contact.id).eq('user_id', user.id);
          if (error) throw error;
          return { success: true };
        }}
        className="mb-6"
      />
    <Tabs defaultValue="disc" className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="disc" className="text-xs">DISC</TabsTrigger>
          <TabsTrigger value="vak" className="text-xs">VAK</TabsTrigger>
          <TabsTrigger value="motivations" className="text-xs">Motivadores</TabsTrigger>
          <TabsTrigger value="rapport" className="text-xs">Rapport & NLP</TabsTrigger>
           <TabsTrigger value="decision" className="text-xs">Decisão</TabsTrigger>
           <TabsTrigger value="influence" className="text-xs">Influência</TabsTrigger>
           <TabsTrigger value="business" className="text-xs">Contexto Business</TabsTrigger>
           <TabsTrigger value="roadmap" className="text-xs">Roadmap 6m</TabsTrigger>
           <TabsTrigger value="audit" className="text-xs">Auditoria & Gaps</TabsTrigger>
           <TabsTrigger value="eq" className="text-xs">Int. Emocional</TabsTrigger>
           <TabsTrigger value="biases" className="text-xs">Vieses</TabsTrigger>
           <TabsTrigger value="metaprograms" className="text-xs">Meta</TabsTrigger>
           <TabsTrigger value="reframing" className="text-xs">Sleight of Mouth</TabsTrigger>
           <TabsTrigger value="personality" className="text-xs">Big Five/MBTI</TabsTrigger>
           <TabsTrigger value="approach" className="text-xs">Abordagem IA</TabsTrigger>
           <TabsTrigger value="sugestoes" className="text-xs">Sugestões por Perfil</TabsTrigger>
           <TabsTrigger value="compatibilidade" className="text-xs">Compatibilidade</TabsTrigger>
           <TabsTrigger value="health" className="text-xs">Saúde do Cliente</TabsTrigger>
           <TabsTrigger value="neuro" className="text-xs">Neuro</TabsTrigger>
           <TabsTrigger value="lgpd" className="text-xs">Consentimento & Export</TabsTrigger>
         </TabsList>
         <ModuleHelp {...moduleHelpContent.disc} />
       </div>

      <TabsContent value="disc" className="space-y-4">
        <DiscSubTab contactId={contact.id} />
        <DISCCommunicationLogsPanel contactId={contact.id} />
      </TabsContent>

      <TabsContent value="vak">
        <VakSubTab contactId={contact.id} />
      </TabsContent>
      
      <TabsContent value="motivations">
        <MotivationsSubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="rapport">
        <div className="space-y-6">
          <RapportStrategySubTab contactId={contact.id} />
          <RapportCard contactId={contact.id} />
        </div>
      </TabsContent>

      <TabsContent value="decision">
        <DecisionMakingSubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="influence">
        <InfluencersSubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="business">
        <BusinessContextSubTab contactId={contact.id} />
      </TabsContent>

       <TabsContent value="roadmap">
         <PredictiveRoadmap contactId={contact.id} />
       </TabsContent>
 
      <TabsContent value="audit">
        <BehavioralAuditSubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="eq">
        <EqSubTab eqAnalysis={eqAnalysis} />
      </TabsContent>

      <TabsContent value="biases" className="space-y-4">
        <BiasesSubTab biases={biases} />
        {panelContact && (
          <CognitiveBiasesPanel contact={panelContact} interactions={panelInteractions} />
        )}
      </TabsContent>

      <TabsContent value="metaprograms">
        <MetaprogramsSubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="personality">
        <PersonalitySubTab contactId={contact.id} />
      </TabsContent>

      <TabsContent value="reframing">
        <SleightOfMouthPanel contactId={contact.id} />
      </TabsContent>

      <TabsContent value="approach">
        {panelContact && (
          <div className="space-y-6">
            <ApproachRecommendationPanel contact={panelContact} interactions={panelInteractions} />
            <SmartTemplateSuggestions contact={panelContact} />
            <TemplatePerformanceComparison contact={panelContact} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="health">
        {panelContact && (
          <ClientHealthPanel contact={panelContact} interactions={mappedInteractions} />
        )}
      </TabsContent>

      <TabsContent value="neuro" className="space-y-6">
        <NeuroDominanceTab contactId={contact.id} />
        {panelContact && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NeuroScore
                contactId={contact.id}
                contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
                discProfile={discProfile}
                interactions={neuroInteractions}
              />
              <NeuroAlerts
                contactId={contact.id}
                contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
                discProfile={discProfile}
                interactions={neuroInteractions}
              />
            </div>
            <NeuroDecisionPath
              contactId={contact.id}
              contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
              discProfile={discProfile}
              interactions={neuroInteractions}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NeuroCompatibilityAnalysis
                salespersonDISC={salespersonDisc ?? (discProfile as 'D' | 'I' | 'S' | 'C' | null) ?? 'S'}
                contactDISC={discProfile as 'D' | 'I' | 'S' | 'C' | null}
                contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
              />
              <NeuroObjectionHandler
                contactId={contact.id}
                contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
              />
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="sugestoes">
        {panelContact && (
          <ProfileBasedSuggestions
            contact={panelContact}
            vakProfile={vakProfile ?? null}
            metaprogramProfile={metaprogramProfile ?? null}
          />
        )}
      </TabsContent>

      <TabsContent value="compatibilidade">
        {panelContact && (
          <div className="space-y-6">
            <CompatibilityScore
              contact={panelContact}
              vakProfile={vakProfile ?? null}
              metaprogramProfile={metaprogramProfile ?? null}
            />
            <TemplateHistoryByProfile />
          </div>
        )}
      </TabsContent>

      <TabsContent value="lgpd" className="space-y-4">
        <ConsentAuditLog contactId={contact.id} />
        <RelationshipReportExport
          contactId={contact.id}
          contactName={`${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()}
        />
      </TabsContent>
    </Tabs>

    {/* Intelligence from external views */}
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      <DiscCompatibilityCard contactId={contact.id} />
      <RapportCard contactId={contact.id} />
      <EmotionalTrendCard contactId={contact.id} />
      <CommunicationDashboardCard contactId={contact.id} />
      <EqEvolutionCard contactId={contact.id} />
      <EqDashboardCard contactId={contact.id} />
      <DashboardErrorBoundary sectionName="Inteligência de Comunicação">
        <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
          <CommunicationIntelWidget contactId={contact.id} />
        </Suspense>
      </DashboardErrorBoundary>
      <DashboardErrorBoundary sectionName="Tendência Emocional">
        <Suspense fallback={<Skeleton className="h-40 rounded-lg" />}>
          <EmotionalTrendWidget contactId={contact.id} />
        </Suspense>
      </DashboardErrorBoundary>
    </div>

    <DashboardErrorBoundary sectionName="Evolução Emocional por Contato">
      <Suspense fallback={<Skeleton className="h-12 rounded-lg" />}>
        <EmotionalTrendByContactWidget contactId={contact.id} />
      </Suspense>
    </DashboardErrorBoundary>

    {/* Relationship Score Evolution Chart */}
    <RelationshipScoreChart contactId={contact.id} />
  </div>
  );
}
