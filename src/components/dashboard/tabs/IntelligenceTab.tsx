import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Target, Clock, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { LazySection } from '@/components/dashboard/LazySection';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { BestTimeHeatmapCard } from '@/components/dashboard/BestTimeHeatmapCard';
import { InboundActivityHeatmapCard } from '@/components/dashboard/InboundActivityHeatmapCard';
import { ChannelPerformanceMatrixCard } from '@/components/dashboard/ChannelPerformanceMatrixCard';
import { TouchpointSequenceCard } from '@/components/dashboard/TouchpointSequenceCard';
import { DealsAtRiskCard } from '@/components/dashboard/DealsAtRiskCard';
import { StrategicNextStepsCard } from '@/components/dashboard/StrategicNextStepsCard';

const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));
const PurchasePatternsPanel = lazy(() => import('@/components/analytics/PurchasePatternsPanel').then(m => ({ default: m.PurchasePatternsPanel })));
const BehaviorAlertsPanel = lazy(() => import('@/components/analytics/BehaviorAlertsPanel').then(m => ({ default: m.BehaviorAlertsPanel })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));

interface IntelligenceTabProps {
  contacts: any[];
  prefersReducedMotion: boolean;
  tabDirection: number;
}

export function IntelligenceTab({ contacts, prefersReducedMotion, tabDirection }: IntelligenceTabProps) {
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div key={`intelligence-${tabDirection}`} initial={animVariants.initial} animate={animVariants.animate} transition={animVariants.transition} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <DashboardErrorBoundary sectionName="Próximos Passos">
          <StrategicNextStepsCard contacts={contacts} className="flex-1 shadow-md border-primary/10" />
        </DashboardErrorBoundary>
        
        <div className="flex-1 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <Typography variant="h4" className="text-primary font-bold">Motor de IA Ativo</Typography>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Nossas redes neurais estão analisando seus contatos para encontrar as melhores oportunidades de fechamento hoje.
          </p>
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
          </div>
        </div>
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