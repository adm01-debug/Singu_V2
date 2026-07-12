 import { lazy, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LazySection } from '@/components/dashboard/LazySection';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import type { Contact, Interaction } from '@/types';

const RelationshipKPIsDashboard = lazy(() => import('@/components/crm/RelationshipKPIsDashboard').then(m => ({ default: m.RelationshipKPIsDashboard })));
const SmartRemindersPanel = lazy(() => import('@/components/smart-reminders/SmartRemindersPanel').then(m => ({ default: m.SmartRemindersPanel })));
const RelationshipStatsPanel = lazy(() => import('@/components/dashboard/RelationshipStatsPanel').then(m => ({ default: m.RelationshipStatsPanel })));
const PortfolioHealthDashboard = lazy(() => import('@/components/dashboard/PortfolioHealthDashboard').then(m => ({ default: m.PortfolioHealthDashboard })));
const HealthAlertsPanel = lazy(() => import('@/components/dashboard/HealthAlertsPanel').then(m => ({ default: m.HealthAlertsPanel })));
const ImportantDatesCalendar = lazy(() => import('@/components/dashboard/ImportantDatesCalendar').then(m => ({ default: m.ImportantDatesCalendar })));
const CompatibilityAlertsList = lazy(() => import('@/components/triggers/CompatibilityAlertsList').then(m => ({ default: m.CompatibilityAlertsList })));
const ClosingScoreAlertsList = lazy(() => import('@/components/analytics/ClosingScoreAlertsList').then(m => ({ default: m.ClosingScoreAlertsList })));
const ClosingScoreRanking = lazy(() => import('@/components/analytics/ClosingScoreRanking').then(m => ({ default: m.ClosingScoreRanking })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));

interface RelationshipsTabProps {
  contacts: Contact[];
  interactions: Interaction[];
  prefersReducedMotion: boolean;
  tabDirection: number;
}

export function RelationshipsTab({ contacts, interactions, prefersReducedMotion, tabDirection }: RelationshipsTabProps) {
   // Memoize sections to prevent unnecessary re-renders during tab transitions
   const livePulseSection = useMemo(() => (
     <DashboardErrorBoundary sectionName="Live Pulse & Gestão de Relacionamento">
       <Suspense fallback={<div className="animate-pulse h-[500px] bg-muted rounded-lg" />}>
         <RelationshipKPIsDashboard />
       </Suspense>
     </DashboardErrorBoundary>
   ), []);
 
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div key={`relationships-${tabDirection}`} initial={animVariants.initial} animate={animVariants.animate} transition={animVariants.transition} className="space-y-5">
       {/* Live Pulse Dashboard (Tempo Real) */}
       {livePulseSection}
 
      {/* Smart Reminders + Compatibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardErrorBoundary sectionName="Lembretes">
          <LazySection fallbackVariant="list">
            <SmartRemindersPanel compact />
          </LazySection>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Compatibilidade">
          <LazySection fallbackVariant="list">
            <CompatibilityAlertsList maxItems={3} />
          </LazySection>
        </DashboardErrorBoundary>
      </div>

      {/* Portfolio Health */}
      <DashboardErrorBoundary sectionName="Saúde do Portfólio">
        <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded-lg" />}>
          <PortfolioHealthDashboard contacts={contacts} interactions={interactions} />
        </Suspense>
      </DashboardErrorBoundary>

      {/* Relationship Stats */}
      <DashboardErrorBoundary sectionName="Estatísticas de Relacionamento">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
          <RelationshipStatsPanel />
        </Suspense>
      </DashboardErrorBoundary>

      {/* RFM Analysis + Closing Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardErrorBoundary sectionName="Segmentação RFM">
          <LazySection fallbackVariant="card">
            <RFMAnalysisPanel compact />
          </LazySection>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Score de Fechamento">
          <LazySection fallbackVariant="list">
            <ClosingScoreRanking maxItems={5} showStats={false} compact />
          </LazySection>
          <LazySection fallbackVariant="list" className="mt-5">
            <ClosingScoreAlertsList maxItems={3} compact />
          </LazySection>
        </DashboardErrorBoundary>
      </div>

      {/* Important Dates Calendar */}
      <DashboardErrorBoundary sectionName="Datas Importantes">
        <LazySection fallbackVariant="list" fallbackHeight="h-48">
          <ImportantDatesCalendar contacts={contacts} interactions={interactions} />
        </LazySection>
      </DashboardErrorBoundary>

      {/* Health Alerts */}
      <DashboardErrorBoundary sectionName="Saúde do Cliente">
        <LazySection fallbackVariant="card">
          <HealthAlertsPanel />
        </LazySection>
      </DashboardErrorBoundary>
    </motion.div>
  );
}
