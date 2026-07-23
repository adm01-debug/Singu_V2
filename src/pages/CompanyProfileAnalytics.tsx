import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsFilters } from '@/components/company-analytics/AnalyticsFilters';
import { InterestsCloud } from '@/components/company-analytics/InterestsCloud';
import { ActivityTimeline } from '@/components/company-analytics/ActivityTimeline';
import { ChannelPreferencesCard } from '@/components/company-analytics/ChannelPreferencesCard';
import { useCompanyProfileAnalytics } from '@/hooks/useCompanyProfileAnalytics';

function parseDays(value: string | null): 30 | 90 | 180 {
  const n = Number(value);
  if (n === 30 || n === 180) return n;
  return 90;
}

const CompanyProfileAnalytics = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const days = parseDays(searchParams.get('days'));
  const contactId = searchParams.get('contact');

  const { data, isLoading, error } = useCompanyProfileAnalytics(companyId, {
    days,
    contactId,
  });

  const setDays = (d: 30 | 90 | 180) => {
    const next = new URLSearchParams(searchParams);
    next.set('days', String(d));
    setSearchParams(next, { replace: true });
  };
  const setContact = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('contact', id);
    else next.delete('contact');
    setSearchParams(next, { replace: true });
  };

  const recentEvents = useMemo(() => data?.interactions.slice(0, 20) ?? [], [data]);
  const contactForEvidence = contactId ?? (data?.contacts.length === 1 ? data.contacts[0].id : null);

  return (
    <AppLayout>
      <SEOHead
        title="Analytics de Perfil da Empresa"
        description="Interesses, timeline de atividades e canais preferidos de comunicação da empresa."
      />
      <div className="min-h-screen pt-2 md:pt-4">
        <div className="px-4 md:px-6 pt-3 md:pt-4">
          <PageHeader
            backTo={companyId ? `/empresas/${companyId}` : '/empresas'}
            backLabel="Empresa"
            title="Analytics de Perfil"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Interesses, timeline e canais preferidos dos contatos vinculados
          </p>
        </div>

        <div className="px-4 md:px-6 py-6 space-y-6">
          {error && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">
                  Erro ao carregar analytics: {error instanceof Error ? error.message : 'desconhecido'}
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading || !data ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full max-w-md" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              <AnalyticsFilters
                days={days}
                onDaysChange={setDays}
                contactId={contactId}
                onContactChange={setContact}
                contacts={data.contacts}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardErrorBoundary sectionName="Interesses">
                  <InterestsCloud
                    interests={data.interests}
                    contactIdForEvidence={contactForEvidence}
                  />
                </DashboardErrorBoundary>

                <DashboardErrorBoundary sectionName="Canais Preferidos">
                  <ChannelPreferencesCard
                    channels={data.channels}
                    preferences={data.preferences}
                    contacts={data.contacts}
                    recommendedChannel={data.recommendedChannel}
                  />
                </DashboardErrorBoundary>
              </div>

              <DashboardErrorBoundary sectionName="Timeline">
                <ActivityTimeline
                  timeline={data.timeline}
                  recentEvents={recentEvents}
                  contacts={data.contacts}
                />
              </DashboardErrorBoundary>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CompanyProfileAnalytics;