import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

const CohortAnalysisAdvanced = lazy(() => import('@/components/bi/CohortAnalysisAdvanced'));
const DemandForecastPanel = lazy(() => import('@/components/bi/DemandForecastPanel'));
const ProfitabilityPanel = lazy(() => import('@/components/bi/ProfitabilityPanel'));
const GeoSalesHeatmap = lazy(() => import('@/components/bi/GeoSalesHeatmap'));
const EmbeddableDashboards = lazy(() => import('@/components/bi/EmbeddableDashboards'));

const TabSkeleton = () => <Skeleton className="h-96 rounded-lg" />;

export default function BIAvancado() {
  return (
    <AppLayout>
      <Helmet>
        <title>BI Avançado | SINGU</title>
        <meta name="description" content="Business Intelligence avançado com cohort, forecasting, rentabilidade e heat maps geográficos." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader
          backTo="/"
          backLabel="Dashboard"
          title="Business Intelligence Avançado"
        />

        <Tabs defaultValue="cohort" className="space-y-4">
          <TabsList className="w-full overflow-x-auto scrollbar-hide flex h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="cohort" className="text-xs sm:text-sm">Coorte</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs sm:text-sm">Previsão de Demanda</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs sm:text-sm">Rentabilidade</TabsTrigger>
            <TabsTrigger value="geo" className="text-xs sm:text-sm">Heat Map Geográfico</TabsTrigger>
            <TabsTrigger value="dashboards" className="text-xs sm:text-sm">Dashboards Embeddable</TabsTrigger>
          </TabsList>

          <TabsContent value="cohort">
            <DashboardErrorBoundary sectionName="Coorte">
              <Suspense fallback={<TabSkeleton />}>
                <CohortAnalysisAdvanced />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="forecast">
            <DashboardErrorBoundary sectionName="Previsão de Demanda">
              <Suspense fallback={<TabSkeleton />}>
                <DemandForecastPanel />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="profitability">
            <DashboardErrorBoundary sectionName="Rentabilidade">
              <Suspense fallback={<TabSkeleton />}>
                <ProfitabilityPanel />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="geo">
            <DashboardErrorBoundary sectionName="Heat Map Geográfico">
              <Suspense fallback={<TabSkeleton />}>
                <GeoSalesHeatmap />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>

          <TabsContent value="dashboards">
            <DashboardErrorBoundary sectionName="Dashboards Embeddable">
              <Suspense fallback={<TabSkeleton />}>
                <EmbeddableDashboards />
              </Suspense>
            </DashboardErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
