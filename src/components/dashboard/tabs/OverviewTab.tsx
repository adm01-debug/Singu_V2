import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { MotionStyle, Transition, TargetAndTransition } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Surface } from '@/components/ui/surface';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TopContactsCard } from '@/components/dashboard/TopContactsCard';
import type { DashboardStats } from '@/hooks/useDashboardStats';

const YourDaySection = lazy(() => import('@/components/dashboard/YourDaySection').then(m => ({ default: m.YourDaySection })));
const PreContactBriefing = lazy(() => import('@/components/briefing/PreContactBriefing').then(m => ({ default: m.PreContactBriefing })));
const PendingFollowupsWidget = lazy(() => import('@/components/dashboard/widgets/PendingFollowupsWidget').then(m => ({ default: m.PendingFollowupsWidget })));
const DailySummaryWidget = lazy(() => import('@/components/dashboard/widgets/DailySummaryWidget').then(m => ({ default: m.DailySummaryWidget })));
const TodaysRemindersWidget = lazy(() => import('@/components/dashboard/widgets/IntelligenceWidgets').then(m => ({ default: m.TodaysRemindersWidget })));
const ActiveAlertsWidget = lazy(() => import('@/components/dashboard/widgets/IntelligenceWidgets').then(m => ({ default: m.ActiveAlertsWidget })));
const BusinessAlertsWidget = lazy(() => import('@/components/dashboard/widgets/BusinessAlertsWidget').then(m => ({ default: m.BusinessAlertsWidget })));
const DataQualityWidget = lazy(() => import('@/components/dashboard/DataQualityWidget').then(m => ({ default: m.DataQualityWidget })));
const StrategicAccountsWidget = lazy(() => import('@/components/dashboard/widgets/StrategicAccountsWidget'));
const ExecutiveKpisWidget = lazy(() => import('@/components/dashboard/widgets/ExecutiveKpisWidget').then(m => ({ default: m.ExecutiveKpisWidget })));
const WeeklySummaryWidget = lazy(() => import('@/components/dashboard/widgets/WeeklySummaryWidget').then(m => ({ default: m.WeeklySummaryWidget })));
const CompleteDashboardWidget = lazy(() => import('@/components/dashboard/widgets/CompleteDashboardWidget'));
const DailyKpisWidget = lazy(() => import('@/components/dashboard/widgets/DailyKpisWidget'));
const CadenceAlertWidget = lazy(() => import('@/components/contact-detail/CadenceAlertWidget'));
const PendingNotificationsWidget = lazy(() => import('@/components/dashboard/widgets/PendingNotificationsWidget'));
const DailyInsightsWidget = lazy(() => import('@/components/dashboard/widgets/DailyInsightsWidget'));
const ChurnRiskReportWidget = lazy(() => import('@/components/dashboard/widgets/ChurnRiskReportWidget'));
interface StaggerAnimation {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
  style: MotionStyle;
}

interface OverviewTabProps {
  stats: DashboardStats;
  briefingOpen: boolean;
  setBriefingOpen: (open: boolean) => void;
  prefersReducedMotion: boolean;
  recentActivityAnimations: StaggerAnimation[];
  topContactAnimations: StaggerAnimation[];
  tabDirection: number;
}

export function OverviewTab({
  stats,
  briefingOpen,
  setBriefingOpen,
  prefersReducedMotion,
  recentActivityAnimations,
  topContactAnimations,
  tabDirection,
}: OverviewTabProps) {
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div
      key={`overview-${tabDirection}`}
      initial={animVariants.initial}
      animate={animVariants.animate}
      transition={animVariants.transition}
      className="space-y-6"
    >
      {/* 1. Stats Grid — most important at-a-glance info */}
      <DashboardStatsGrid stats={stats} prefersReducedMotion={prefersReducedMotion} />

      {/* 1b. Executive KPIs + Weekly Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardErrorBoundary sectionName="KPIs Executivos">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <ExecutiveKpisWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Resumo Semanal">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <WeeklySummaryWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 2. Your Day + Pending Followups */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardErrorBoundary sectionName="Seu Dia">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <YourDaySection />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Resumo Diário">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <DailySummaryWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Follow-ups">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <PendingFollowupsWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 3. Pre-Contact Briefing */}
      <DashboardErrorBoundary sectionName="Briefing">
        <Collapsible open={briefingOpen} onOpenChange={setBriefingOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full gap-2 text-muted-foreground hover:text-primary border-dashed hover:border-primary/40 hover:bg-primary/5 transition-all duration-200",
                briefingOpen && "border-primary/30 bg-primary/5 text-primary"
              )}
            >
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Brain className="w-3 h-3 text-primary" />
              </div>
              <span className="font-medium">Briefing Pré-Contato</span>
              {!briefingOpen && (
                <span className="text-[10px] text-muted-foreground/70 ml-1 hidden sm:inline">
                  Resumo inteligente dos seus contatos prioritários
                </span>
              )}
              {briefingOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
              <PreContactBriefing compact />
            </Suspense>
          </CollapsibleContent>
        </Collapsible>
      </DashboardErrorBoundary>

      {/* 3b. Today's Reminders + Active Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardErrorBoundary sectionName="Lembretes">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <TodaysRemindersWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Alertas">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <ActiveAlertsWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 3c. Business Alerts + Strategic Accounts */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardErrorBoundary sectionName="Alertas de Negócio">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <BusinessAlertsWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Contas Estratégicas">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
            <StrategicAccountsWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 3c. Data Quality */}
      <DashboardErrorBoundary sectionName="Qualidade de Dados">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
          <DataQualityWidget />
        </Suspense>
      </DashboardErrorBoundary>

      {/* 4a. Painel Executivo */}
      <DashboardErrorBoundary sectionName="Painel Executivo">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
          <CompleteDashboardWidget />
        </Suspense>
      </DashboardErrorBoundary>

      {/* 4b. KPIs Diários + Cadência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardErrorBoundary sectionName="KPIs Diários">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-28 w-full" />}>
            <DailyKpisWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Cadência">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-28 w-full" />}>
            <CadenceAlertWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 5. Notificações + Insights + Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardErrorBoundary sectionName="Notificações">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-28 w-full" />}>
            <PendingNotificationsWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Insights Diários">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-28 w-full" />}>
            <DailyInsightsWidget />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Relatório Churn">
          <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-28 w-full" />}>
            <ChurnRiskReportWidget />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      {/* 6. Recent Activity + Top Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardErrorBoundary sectionName="Atividade Recente">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          >
            <RecentActivityCard activities={stats.recentActivities} animations={recentActivityAnimations} />
          </motion.div>
        </DashboardErrorBoundary>

        <DashboardErrorBoundary sectionName="Melhores Relacionamentos">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: prefersReducedMotion ? 0 : 0.05 }}
          >
            <TopContactsCard contacts={stats.topContacts} animations={topContactAnimations} />
          </motion.div>
        </DashboardErrorBoundary>
      </div>
    </motion.div>
  );
}
