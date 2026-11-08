import { lazy, Suspense } from 'react';
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
import { ContactFamilyInterestsCard } from './behavioral-tab/ContactFamilyInterestsCard';
import { RapportStrategySubTab } from './behavioral-tab/RapportStrategySubTab';
const CommunicationIntelWidget = lazy(() => import('./CommunicationIntelWidget'));
const EmotionalTrendWidget = lazy(() => import('./EmotionalTrendWidget'));
const EmotionalTrendByContactWidget = lazy(() => import('./EmotionalTrendByContactWidget'));
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryExternalData } from '@/lib/externalData';
import type { Tables } from '@/integrations/supabase/types';
import { ModuleHelp, moduleHelpContent } from '@/components/ui/module-help';
import type { Contact } from '@/hooks/useContactDetail';

 interface Props {
   contact: Contact;
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
 
 export function ContactBehavioralTab({ contact }: Props) {
   const { user } = useAuth();
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
         </TabsList>
         <ModuleHelp {...moduleHelpContent.disc} />
       </div>

      <TabsContent value="disc" className="space-y-4">
        <DiscSubTab contactId={contact.id} />
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

      <TabsContent value="biases">
        <BiasesSubTab biases={biases} />
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
