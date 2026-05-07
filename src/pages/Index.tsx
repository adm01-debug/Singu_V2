import { useState, useRef } from 'react';
import { TeamDashboardPanel } from '@/components/team/TeamDashboardPanel';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';
import { LayoutGrid, BarChart3, Heart, Brain } from 'lucide-react';
import { ScrollProgressBar } from '@/components/dashboard/ScrollProgressBar';
import { WelcomeGreetingPopup } from '@/components/dashboard/WelcomeGreetingPopup';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { DailyBriefingCard } from '@/components/dashboard/DailyBriefingCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { useCompatibilityAlerts } from '@/hooks/useCompatibilityAlerts';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

// Hooks for real data
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardMappedData } from '@/hooks/useDashboardMappedData';

// Tab components
import { OverviewTab } from '@/components/dashboard/tabs/OverviewTab';
import { AnalyticsTab } from '@/components/dashboard/tabs/AnalyticsTab';
import { RelationshipsTab } from '@/components/dashboard/tabs/RelationshipsTab';
import { IntelligenceTab } from '@/components/dashboard/tabs/IntelligenceTab';
import { CRMJsonLd } from '@/components/seo/JsonLd';

const TAB_ORDER = ['overview', 'analytics', 'relationships', 'intelligence'];

const TAB_CONFIG = [
  { value: 'overview', icon: LayoutGrid, label: 'Geral' },
  { value: 'analytics', icon: BarChart3, label: 'Analytics' },
  { value: 'relationships', icon: Heart, label: 'Relações' },
  { value: 'intelligence', icon: Brain, label: 'IA' },
];

const Dashboard = () => {
  usePageTitle('Dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [tabDirection, setTabDirection] = useState(0);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Data hooks
  const { contacts, loading: contactsLoading } = useContacts();
  const { companies, loading: companiesLoading } = useCompanies();
  const { interactions, loading: interactionsLoading } = useInteractions();
  const dashboardStats = useDashboardStats({
    contacts,
    companies,
    interactions,
    loading: contactsLoading || companiesLoading || interactionsLoading,
  });

  useCompatibilityAlerts();
  const prefersReducedMotion = useReducedMotion();

  const { loading, topContacts, recentActivities } = dashboardStats;
  const recentActivityAnimations = useStaggerAnimation(recentActivities.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });
  const topContactAnimations = useStaggerAnimation(topContacts.length, { baseDelay: 0.025, maxDelay: 0.3, duration: 0.2 });

  // Mapped data — only computed when relationships tab is active
  const needsMappedData = activeTab === 'relationships';
  const { mappedContacts, mappedInteractions } = useDashboardMappedData(
    contacts, companies, interactions, needsMappedData,
  );

  if (loading) {
    return (
      <AppLayout>
      <SEOHead title="Dashboard" description="Painel de controle com métricas e insights em tempo real" />
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const hasProfile = !!dashboardStats.totalContacts || !!dashboardStats.totalCompanies;
  const hasContacts = dashboardStats.totalContacts > 0;
  const hasCompanies = dashboardStats.totalCompanies > 0;
  const hasInteractions = dashboardStats.weeklyInteractions > 0;

  const handleTabChange = (value: string) => {
    const oldIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = TAB_ORDER.indexOf(value);
    setTabDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(value);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <AppLayout>
      <CRMJsonLd />
      <ScrollProgressBar />

      <div className="p-4 md:p-6 space-y-5 md:space-y-6">
        <WelcomeGreetingPopup />
        <DailyBriefingCard
          contacts={contacts}
          interactions={interactions}
          weeklyInteractions={dashboardStats.weeklyInteractions}
        />
        <OnboardingChecklist
          hasProfile={hasProfile}
          hasContacts={hasContacts}
          hasCompanies={hasCompanies}
          hasInteractions={hasInteractions}
        />

        {/* Dashboard Tabs */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="sticky top-[57px] md:top-0 z-10 -mx-4 border-b border-border/30 bg-background/80 px-4 pb-3 pt-2 shadow-[0_16px_40px_-34px_hsl(var(--foreground)/0.7)] backdrop-blur-lg md:-mx-6 md:px-6">
              <TabsList className="grid w-full grid-cols-4 relative">
                {TAB_CONFIG.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative z-[1] gap-1 rounded-xl text-[11px] font-medium transition-colors active:scale-[0.97] data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground/80 data-[state=inactive]:hover:text-foreground sm:text-sm"
                  >
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId="dashboard-tab-indicator"
                        className="absolute inset-0 bg-primary rounded-lg shadow-md"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-[1] flex items-center gap-1">
                      <tab.icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate text-[11px] sm:text-sm">{tab.label}</span>
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-5 mt-4">
              <OverviewTab
                stats={dashboardStats}
                briefingOpen={briefingOpen}
                setBriefingOpen={setBriefingOpen}
                prefersReducedMotion={prefersReducedMotion}
                recentActivityAnimations={recentActivityAnimations}
                topContactAnimations={topContactAnimations}
                tabDirection={tabDirection}
              />
              <TeamDashboardPanel />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <AnalyticsTab prefersReducedMotion={prefersReducedMotion} tabDirection={tabDirection} />
            </TabsContent>

            <TabsContent value="relationships" className="mt-4">
              <RelationshipsTab
                contacts={mappedContacts}
                interactions={mappedInteractions}
                prefersReducedMotion={prefersReducedMotion}
                tabDirection={tabDirection}
              />
            </TabsContent>

            <TabsContent value="intelligence" className="mt-4">
              <IntelligenceTab prefersReducedMotion={prefersReducedMotion} tabDirection={tabDirection} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <FloatingQuickActions />
    </AppLayout>
  );
};

export default Dashboard;
