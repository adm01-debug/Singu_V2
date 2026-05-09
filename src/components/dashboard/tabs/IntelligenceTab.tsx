import { lazy } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Target, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { LazySection } from '@/components/dashboard/LazySection';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { BestTimeHeatmapCard } from '@/components/dashboard/BestTimeHeatmapCard';
import { InboundActivityHeatmapCard } from '@/components/dashboard/InboundActivityHeatmapCard';
import { ChannelPerformanceMatrixCard } from '@/components/dashboard/ChannelPerformanceMatrixCard';
import { TouchpointSequenceCard } from '@/components/dashboard/TouchpointSequenceCard';
import { DealsAtRiskCard } from '@/components/dashboard/DealsAtRiskCard';

const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));
const PurchasePatternsPanel = lazy(() => import('@/components/analytics/PurchasePatternsPanel').then(m => ({ default: m.PurchasePatternsPanel })));
const BehaviorAlertsPanel = lazy(() => import('@/components/analytics/BehaviorAlertsPanel').then(m => ({ default: m.BehaviorAlertsPanel })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));

interface IntelligenceTabProps {
  prefersReducedMotion: boolean;
  tabDirection: number;
}

export function IntelligenceTab({ prefersReducedMotion, tabDirection }: IntelligenceTabProps) {
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
      <motion.div key={`intelligence-${tabDirection}`} initial={animVariants.initial} animate={animVariants.animate} transition={animVariants.transition} className="space-y-5">
        <div className="flex items-center justify-between">
          <DashboardErrorBoundary sectionName="Próximos Passos">
            <StrategicNextStepsCard contacts={[]} className="w-full lg:max-w-xl" />
          </DashboardErrorBoundary>
        </div>

        <DashboardErrorBoundary sectionName="Padrões de Compra">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
            <Typography variant="h4" gradient>Padrões de Compra e Comportamento</Typography>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LazySection fallbackVariant="chart">
              <PurchasePatternsPanel compact />
            </LazySection>
            <LazySection fallbackVariant="card">
              <BehaviorAlertsPanel compact />
            </LazySection>
          </div>
        </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Inteligência de Negócios">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4" gradient>Inteligência de Negócios</Typography>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <LazySection fallbackVariant="chart">
            <ChurnPredictionPanel compact />
          </LazySection>
          <LazySection fallbackVariant="chart">
            <BestTimeToContactPanel compact />
          </LazySection>
          <LazySection fallbackVariant="chart">
            <DealVelocityPanel compact />
          </LazySection>
        </div>

        <div className="mt-5">
          <LazySection fallbackVariant="chart" fallbackHeight="h-64">
            <RFMAnalysisPanel compact />
          </LazySection>
        </div>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Mapas de Calor de Timing">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4" gradient>Timing de Prospecção & Inbound</Typography>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <LazySection fallbackVariant="chart" fallbackHeight="h-64">
            <BestTimeHeatmapCard />
          </LazySection>
          <LazySection fallbackVariant="chart" fallbackHeight="h-64">
            <InboundActivityHeatmapCard />
          </LazySection>
        </div>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Performance por Canal">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4" gradient>Performance por Canal</Typography>
        </div>
        <LazySection fallbackVariant="chart" fallbackHeight="h-80">
          <ChannelPerformanceMatrixCard />
        </LazySection>
        <div className="mt-5">
          <LazySection fallbackVariant="chart" fallbackHeight="h-80">
            <TouchpointSequenceCard />
          </LazySection>
        </div>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Deals em Risco">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
          <Typography variant="h4" gradient>Slip Risk</Typography>
        </div>
        <DealsAtRiskCard />
      </DashboardErrorBoundary>
    </motion.div>
  );
}
