import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { DISCConversionMetricsPanel } from '@/components/analytics/DISCConversionMetricsPanel';
import { TriggerAnalyticsPanel } from '@/components/analytics/TriggerAnalyticsPanel';
import { RFMSegmentDashboard } from '@/components/analytics/RFMSegmentDashboard';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Surface } from '@/components/ui/surface';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

const ActivityChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.ActivityChart })));
const RelationshipEvolutionChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.RelationshipEvolutionChart })));
const ContactDistributionChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.ContactDistributionChart })));
const RelationshipScoreChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.RelationshipScoreChart })));
const SentimentChart = lazy(() => import('@/components/dashboard/DashboardCharts').then(m => ({ default: m.SentimentChart })));
const DailyInsightsWidget = lazy(() => import('@/components/dashboard/widgets/DailyInsightsWidget').then(m => ({ default: m.DailyInsightsWidget })));
const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));


type PeriodFilter = '7d' | '30d' | '90d';

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Última Semana' },
  { value: '30d', label: 'Último Mês' },
  { value: '90d', label: 'Últimos 3 Meses' },
];

interface AnalyticsTabProps {
  contacts: any[];
  companies: any[];
  interactions: any[];
  prefersReducedMotion: boolean;
  tabDirection: number;
}

export function AnalyticsTab({ contacts, companies, interactions, prefersReducedMotion, tabDirection }: AnalyticsTabProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7d');

  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div key={`analytics-${tabDirection}`} initial={animVariants.initial} animate={animVariants.animate} transition={animVariants.transition} className="space-y-5">
      {/* Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-5 h-5" aria-hidden="true" />
          <Typography variant="body" className="font-medium">Período dos Gráficos</Typography>
        </div>
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(option.value)}
              className={`text-xs sm:text-sm transition-all ${period === option.value ? 'shadow-sm' : 'hover:bg-secondary'}`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <DashboardErrorBoundary sectionName="Insights da IA">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-32 w-full" />}>
          <div className="mb-5">
            <DailyInsightsWidget contacts={contacts} interactions={interactions} />
          </div>
        </Suspense>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Gráficos de Atividade">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-64 w-full" />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ActivityChart period={period} interactions={interactions} />
            <RelationshipEvolutionChart period={period} contacts={contacts} interactions={interactions} />
          </div>
        </Suspense>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Distribuição e Scores">
        <Suspense fallback={<Surface level={1} rounded="lg" className="animate-pulse h-48 w-full" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ContactDistributionChart contacts={contacts} />
            <RelationshipScoreChart period={period} contacts={contacts} />
            <SentimentChart period={period} contacts={contacts} interactions={interactions} />
          </div>
        </Suspense>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Conversão por Perfil DISC">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
          <DISCConversionMetricsPanel />
        </Suspense>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Métricas RFM Avançadas">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
          <RFMSegmentDashboard />
        </Suspense>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Analytics de Gatilhos">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
          <TriggerAnalyticsPanel />
        </Suspense>
      </DashboardErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardErrorBoundary sectionName="Previsão de Churn">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <ChurnPredictionPanel compact />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Melhor Horário">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <BestTimeToContactPanel compact />
          </Suspense>
        </DashboardErrorBoundary>
        <DashboardErrorBoundary sectionName="Velocidade de Negócio">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <DealVelocityPanel compact />
          </Suspense>
        </DashboardErrorBoundary>
      </div>
    </motion.div>
  );
}
