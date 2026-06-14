import { useEffect, useState, lazy, Suspense } from 'react';
import { CustomFieldsDisplay } from '@/components/custom-fields/CustomFieldsDisplay';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { CSATPanel } from '@/components/csat/CSATPanel';
import { VisitCheckinPanel } from '@/components/visits/VisitCheckinPanel';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Video, LayoutGrid, FileText } from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatContactName } from '@/lib/formatters';
import { PageHeader } from '@/components/navigation/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIEmailComposerTrigger } from '@/components/ai/AIEmailComposerTrigger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContactDetail } from '@/hooks/useContactDetail';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useLuxIntelligence } from '@/hooks/useLuxIntelligence';
import { useProactiveIntelligence } from '@/hooks/useProactiveIntelligence';
import { LuxButton } from '@/components/lux/LuxButton';
import { LuxIntelligencePanel } from '@/components/lux/LuxIntelligencePanel';
import { ProactiveIntelligencePanel } from '@/components/proactive-intelligence/ProactiveIntelligencePanel';
import { ContactTouchpointsTab } from '@/components/marketing/ContactTouchpointsTab';
import {
  ContactDetailHeader,
  ContactOverviewTab,
  ContactInteractionsTab,
  ContactBehavioralTab,
  ContactIntelligenceTab,
   ContactCommercialTab,
   ContactDataTab,
   LifeEventsTab,
 } from '@/components/contact-detail';
 import { NeuromarketingTimeline } from '@/components/crm/behavior/NeuromarketingTimeline';
import { RelationshipTimeline } from '@/components/contact-detail/RelationshipTimeline';
import { MeetingMode } from '@/components/contact-detail/MeetingMode';
import { ValidateAllButton } from '@/components/enrichment/ValidateAllButton';
import { PeopleIntelTimeline } from '@/components/enrichment/PeopleIntelTimeline';
import { ContactEmailThreadsSection } from '@/components/contact-detail/ContactEmailThreadsSection';
   import { SentimentTrendChart } from '@/components/contact-detail/SentimentTrendChart';
   import { NextBestAction } from '@/components/crm/NextBestAction';
   import { SocialMediaIntelligenceCard } from '@/components/contact-detail/SocialMediaIntelligenceCard';
   import { EscalationAutomation } from '@/components/crm/EscalationAutomation';

const ContactTimelineWidget = lazy(() => import('@/components/contact-detail/ContactTimelineWidget'));
const UnifiedCommunicationHistory = lazy(() => import('@/components/interactions/UnifiedCommunicationHistory'));

const ContactDetailSkeleton = () => (
  <AppLayout>
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      <Skeleton className="h-5 w-56" />
      <div className="rounded-xl border p-6 space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  </AppLayout>
);

const ContatoDetalhe = () => {
  const { id } = useParams();
  const { contact, company, interactions, insights, alerts, loading, error, refetch } = useContactDetail(id);
  const { trackView } = useRecentlyViewed();
   const { 
     records: luxRecords, 
     latestRecord, 
     loading: luxLoading, 
     triggering, 
     triggerLux,
     createStakeholderContact
   } = useLuxIntelligence('contact', id);
  const proactiveIntelligence = useProactiveIntelligence(contact, interactions);
  const [meetingMode, setMeetingMode] = useState(false);

  useEffect(() => {
    if (contact && id) {
      trackView({
        id,
        type: 'contact',
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        subtitle: contact.role_title || undefined,
        avatarUrl: contact.avatar_url || undefined,
      });
    }
  }, [contact, id, trackView]);

  const handleTriggerLux = () => {
    if (!contact) return;
    triggerLux({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      linkedin: contact.linkedin,
      instagram: contact.instagram,
      twitter: contact.twitter,
      company_name: company?.name,
    });
  };

  if (loading) return <ContactDetailSkeleton />;

  if (error || !contact) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Contato não encontrado'}</p>
          <Link to="/contatos">
            <Button variant="link">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar para contatos
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isProcessing = latestRecord?.status === 'processing';

  return (
    <>
    <AppLayout>
      <SEOHead title={formatContactName(contact.first_name, contact.last_name)} description={`Detalhes do contato ${formatContactName(contact.first_name, contact.last_name)}`} />
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        {/* Breadcrumb + Lux */}
        <PageHeader
          backTo="/contatos"
          backLabel="Contatos"
          title={formatContactName(contact.first_name, contact.last_name)}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/contatos/${contact.id}/ficha-360`}>
                  <LayoutGrid className="h-4 w-4" />
                  Ficha 360
                </Link>
              </Button>
              <AIEmailComposerTrigger variant="pill" prefilledContactId={contact.id} label="Email com IA" />
              <ValidateAllButton
                contactId={contact.id}
                fallbackEmail={contact.email}
                fallbackPhone={contact.phone}
              />
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/contatos/${contact.id}/relatorio`}>
                  <FileText className="h-4 w-4" />
                  Relatório Completo
                </Link>
              </Button>
              <LuxButton
                onClick={handleTriggerLux}
                loading={triggering}
                processing={isProcessing}
                variant="header"
              />
            </div>
          }
        />

        {/* Header Card */}
        <ContactDetailHeader
          contact={contact}
          company={company}
          interactionCount={interactions.length}
        />

        {/* Meeting Mode Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMeetingMode(true)}
            className="gap-2"
          >
            <Video className="w-4 h-4" />
            Modo Reunião
          </Button>
        </div>

        {/* Proactive Intelligence Panel */}
        <ProactiveIntelligencePanel
          data={proactiveIntelligence}
          contactName={formatContactName(contact.first_name, contact.last_name)}
        />

        {/* Tab Navigation */}
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="w-full overflow-x-auto scrollbar-hide flex h-auto gap-1 bg-muted/50 p-1 md:flex-wrap">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
            <TabsTrigger value="interacoes" className="text-xs sm:text-sm">
              Atividades
            </TabsTrigger>
            <TabsTrigger value="comportamental" className="text-xs sm:text-sm">Comportamental</TabsTrigger>
            <TabsTrigger value="inteligencia" className="text-xs sm:text-sm">Inteligência</TabsTrigger>
            <TabsTrigger value="comercial" className="text-xs sm:text-sm">Comercial</TabsTrigger>
            <TabsTrigger value="lux" className="text-xs sm:text-sm">Lux Intelligence</TabsTrigger>
            <TabsTrigger value="touchpoints" className="text-xs sm:text-sm">Touchpoints</TabsTrigger>
            <TabsTrigger value="life-events" className="text-xs sm:text-sm">Marcos de Vida</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <DashboardErrorBoundary sectionName="Resumo">
              <div className="space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2">
                      <NextBestAction contactId={contact.id} />
                    </div>
                    <div className="xl:col-span-1">
                      <EscalationAutomation contactId={contact.id} />
                    </div>
                  </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ContactOverviewTab
                    contact={contact}
                    company={company}
                    insights={insights}
                    alerts={alerts}
                    interactionCount={interactions.length}
                  />
                  <SocialMediaIntelligenceCard 
                    contactId={contact.id} 
                    linkedin={contact.linkedin}
                    instagram={contact.instagram}
                    twitter={contact.twitter}
                  />
                </div>
                 <RelationshipTimeline
                   interactions={interactions}
                   contact={contact}
                 />
                <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
                  <ContactTimelineWidget contactId={contact.id} />
                </Suspense>
              </div>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="dados">
            <DashboardErrorBoundary sectionName="Dados">
              <div className="space-y-4">
                <ContactDataTab contact={contact} />
                <PeopleIntelTimeline contactId={contact.id} />
                <CustomFieldsDisplay entityType="contact" entityId={contact.id} />
                <DocumentsPanel entityType="contact" entityId={contact.id} />
              </div>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="interacoes">
            <DashboardErrorBoundary sectionName="Atividades">
              <SentimentTrendChart contactId={contact.id} />
              <ContactEmailThreadsSection contactId={contact.id} />
              <ContactInteractionsTab
                interactions={interactions}
                contact={contact}
                companyId={contact.company_id}
                onInteractionAdded={refetch}
              />
              <Suspense fallback={<Skeleton className="h-40 rounded-lg mt-4" />}>
                <div className="mt-4">
                  <UnifiedCommunicationHistory contactId={contact.id} />
                </div>
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

           <TabsContent value="comportamental" className="space-y-4">
             <DashboardErrorBoundary sectionName="Comportamental">
               <NeuromarketingTimeline contactId={contact.id} />
               <ContactBehavioralTab contact={contact} />
             </DashboardErrorBoundary>
           </TabsContent>

          <TabsContent value="inteligencia">
            <DashboardErrorBoundary sectionName="Inteligência">
               <ContactIntelligenceTab
                 contactId={contact.id}
                 contactName={formatContactName(contact.first_name, contact.last_name)}
                 linkedinUrl={contact.linkedin}
                 websiteUrl={company?.website}
                 currentScore={contact.relationship_score || 0}
                 currentSentiment={contact.sentiment || 'neutral'}
                 interactions={interactions}
               />

            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="comercial">
            <DashboardErrorBoundary sectionName="Comercial">
              <div className="space-y-4">
                <ContactCommercialTab contactId={contact.id} />
                <CSATPanel contactId={contact.id} />
                <VisitCheckinPanel contactId={contact.id} entityType="contact" />
              </div>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="lux">
            <DashboardErrorBoundary sectionName="Lux Intelligence">
              <Card>
                <CardContent className="pt-6">
                   <LuxIntelligencePanel
                     record={latestRecord}
                     records={luxRecords}
                     entityType="contact"
                     loading={luxLoading}
                     onTrigger={handleTriggerLux}
                     triggering={triggering}
                     onAddContact={async (s) => {
                       await createStakeholderContact(s);
                     }}
                   />
                </CardContent>
              </Card>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="touchpoints">
            <DashboardErrorBoundary sectionName="Touchpoints">
              <ContactTouchpointsTab contactId={contact.id} />
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="life-events">
            <DashboardErrorBoundary sectionName="Marcos de Vida">
              <LifeEventsTab contactId={contact.id} />
            </DashboardErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>

    {/* Meeting Mode Overlay */}
    <MeetingMode
      contact={contact}
      interactions={interactions}
      open={meetingMode}
      onClose={() => setMeetingMode(false)}
    />
    </>
  );
};

export default ContatoDetalhe;
