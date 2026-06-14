import React, { useState, useEffect, lazy, Suspense } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AnalyticsEngagementTab } from './analytics/AnalyticsEngagementTab';
import { AnalyticsSentimentTab } from './analytics/AnalyticsSentimentTab';
import { motion } from 'framer-motion';
import { Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart,
} from 'recharts';
import {
  TrendingUp, BarChart3, Users,
  MessageSquare, Heart, Target, Zap, Calendar, Download, RefreshCw, Brain,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { TriggerAnalytics } from '@/components/triggers/TriggerAnalytics';
import { AdvancedTriggersPanel } from '@/components/triggers/AdvancedTriggersPanel';
import { ChurnPredictionPanel } from '@/components/analytics/ChurnPredictionPanel';
import { BestTimeToContactPanel } from '@/components/analytics/BestTimeToContactPanel';
import { DealVelocityPanel } from '@/components/analytics/DealVelocityPanel';
import { ClosingScoreRanking } from '@/components/analytics/ClosingScoreRanking';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { RFMAnalysisPanel } from '@/components/analytics/RFMAnalysisPanel';
// Lazy-loaded heavy panels (recharts-bound) — split off the Analytics chunk
const NLPAnalyticsPanel = lazy(() => import('@/components/analytics/NLPAnalyticsPanel').then(m => ({ default: m.NLPAnalyticsPanel })));
const RfmExternalDashboard = lazy(() => import('@/components/analytics/RfmExternalDashboard'));
const DISCAnalyticsPanel = lazy(() => import('@/components/analytics/DISCAnalyticsPanel'));
const NeuroPortfolioDashboard = lazy(() => import('@/components/analytics/NeuroPortfolioDashboard'));
const AdvancedAnalyticsTab = lazy(() => import('@/components/analytics/AdvancedAnalyticsTab'));
const ReportsTab = lazy(() => import('@/components/analytics/ReportsTab'));
 import { DISCTrainingMode, DISCConversionMetrics, DISCCompatibilityAlerts } from '@/components/disc';
import {
  NLPTrainingMode, NLPConversionMetrics,
  RapportRealtimeCoach, IncongruenceDetector, MiltonianCalibration,
  PerceptualPositions, TOTEModelMapper, HierarchyOfCriteria,
  WellFormedOutcomeBuilder, ChunkingNavigator, AnchorTrackingSystem,
  StateElicitationToolkit, SubmodalityModifier, SwishPatternGenerator,
} from '@/components/nlp';
import {
  NeuroEnrichedTriggers, NeuroRadarChart, NeuroTimeline,
  NeuroABTracker, NeuroHeatmapCalendar, NeuroTrainingMode,
  NeurochemicalInfluenceMap,
} from '@/components/neuromarketing';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { DataHealthWidget } from '@/components/analytics/DataHealthWidget';
import { UsageKpisWidget } from '@/components/analytics/UsageKpisWidget';
import { DiscDashboardWidget } from '@/components/analytics/DiscDashboardWidget';
import { BirthdayContactsWidget } from '@/components/analytics/BirthdayContactsWidget';
import { OrphanContactsWidget } from '@/components/analytics/OrphanContactsWidget';
import type { PeriodFilter } from '@/lib/tab-utils';

const BehavioralIntelSummaryWidget = lazy(() => import('@/components/analytics/BehavioralIntelSummaryWidget'));
const DailyStatsWidget = lazy(() => import('@/components/analytics/DailyStatsWidget'));
const TagCloudWidget = lazy(() => import('@/components/analytics/TagCloudWidget'));
const TagExplorerWidget = lazy(() => import('@/components/analytics/TagExplorerWidget'));

// Extracted data & shared components
import {
  periodOptions, getMetricsStats,
  getRelationshipEvolutionData, getSentimentDistributionData,
  getSentimentColors, getEngagementByChannelData,
  getEngagementRadarData, getTopPerformersData,
} from '@/data/analyticsData';
import { CustomTooltip, StatCard } from '@/components/analytics/AnalyticsShared';

const Analytics = () => {
  usePageTitle('Analytics');
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = getMetricsStats(period);
  const relationshipData = getRelationshipEvolutionData(period);
  const sentimentData = getSentimentDistributionData(period);
  const sentimentColors = getSentimentColors();
  const channelData = getEngagementByChannelData(period);
  const radarData = getEngagementRadarData(period);
  const topPerformers = getTopPerformersData();

  if (loading) {
    return (
      <AppLayout>
        <Header title="Analytics" subtitle="Métricas avançadas de relacionamento e engajamento" hideBack />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Analytics" description="Métricas avançadas de relacionamento e engajamento" />
      <Header title="Analytics" subtitle="Métricas avançadas de relacionamento e engajamento" hideBack />
      
      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />
        <Suspense fallback={<Skeleton className="h-28 rounded-lg" />}>
          <BehavioralIntelSummaryWidget />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
          <DailyStatsWidget />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-20 rounded-lg" />}>
          <TagCloudWidget />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
          <TagExplorerWidget />
        </Suspense>

        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />Exportar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total de Interações" value={stats.totalInteractions.current} comparison={stats.totalInteractions} icon={MessageSquare} iconColor="bg-primary/10 text-primary" />
          <StatCard title="Score Médio" value={`${stats.avgScore.current}%`} comparison={stats.avgScore} icon={Heart} iconColor="bg-destructive/10 text-destructive" />
          <StatCard title="Taxa Positiva" value={`${stats.positiveRate.current}%`} comparison={stats.positiveRate} icon={TrendingUp} iconColor="bg-success/10 text-success" />
          <StatCard title="Engajamento" value={`${stats.engagementRate.current}%`} comparison={stats.engagementRate} icon={Zap} iconColor="bg-warning/10 text-warning" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-7xl grid-cols-11">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />Relatórios</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />Avançado</TabsTrigger>
            <TabsTrigger value="disc" className="gap-1"><Brain className="w-3.5 h-3.5" />DISC</TabsTrigger>
            <TabsTrigger value="neuro" className="gap-1"><Zap className="w-3.5 h-3.5" />Neuro</TabsTrigger>
            <TabsTrigger value="rfm" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />RFM</TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1"><Target className="w-3.5 h-3.5" />Inteligência</TabsTrigger>
            <TabsTrigger value="nlp" className="gap-1"><Brain className="w-3.5 h-3.5" />PNL</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
            <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <ReportsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <AdvancedAnalyticsTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="neuro" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <NeuroPortfolioDashboard />
              </Suspense>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NeuroRadarChart discProfile={null} interactions={[]} title="Balanço Neural Médio do Portfólio" />
                <NeuroTimeline contactName="Portfólio Geral" interactions={[]} maxEntries={8} />
              </div>
              <NeuroTrainingMode />
              <NeuroHeatmapCalendar contactName="Portfólio Geral" />
              <NeurochemicalInfluenceMap />
              <NeuroABTracker contactName="Portfólio Completo" />
              <NeuroEnrichedTriggers showAll />
            </motion.div>
          </TabsContent>

           <TabsContent value="disc" className="space-y-6">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                 <DISCAnalyticsPanel />
               </Suspense>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <DISCCompatibilityAlerts />
                 <DISCConversionMetrics />
               </div>
               <DISCTrainingMode />
             </motion.div>
           </TabsContent>

          <TabsContent value="rfm" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <RfmExternalDashboard />
              </Suspense>
              <RFMAnalysisPanel />
            </motion.div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ClosingScoreRanking showStats maxItems={10} />
              <ChurnPredictionPanel maxItems={10} />
              <AccountChurnPredictionPanel />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BestTimeToContactPanel />
                <DealVelocityPanel />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="nlp" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <NLPAnalyticsPanel />
              </Suspense>
              <NLPTrainingMode />
              <NLPConversionMetrics />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><RapportRealtimeCoach /><MiltonianCalibration /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><IncongruenceDetector /><PerceptualPositions /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><TOTEModelMapper /><HierarchyOfCriteria /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><WellFormedOutcomeBuilder /><ChunkingNavigator /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><AnchorTrackingSystem /><StateElicitationToolkit /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SubmodalityModifier /><SwishPatternGenerator /></div>
            </motion.div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />Evolução do Relacionamento
                    </CardTitle>
                    <CardDescription>Score médio e novos contatos ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={relationshipData}>
                          <defs>
                            <linearGradient id="colorScoreAnalytics" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="score" name="Score" stroke="hsl(221, 83%, 53%)" fill="url(#colorScoreAnalytics)" strokeWidth={2} />
                          <Bar yAxisId="right" dataKey="newContacts" name="Novos Contatos" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />Top Relacionamentos
                    </CardTitle>
                    <CardDescription>Contatos com maior score de relacionamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topPerformers.map((performer, index) => (
                        <motion.div key={performer.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.interactions} interações</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">{performer.score}</p>
                            <Badge variant="outline" className={cn("text-xs", performer.sentiment === 'positivo' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground')}>
                              {performer.sentiment}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* External Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <DataHealthWidget />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <UsageKpisWidget />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <DiscDashboardWidget />
              </motion.div>
            </div>

            {/* Contact Quality Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <BirthdayContactsWidget />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <OrphanContactsWidget />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <AnalyticsEngagementTab channelData={channelData} radarData={radarData} relationshipData={relationshipData} />
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <AnalyticsSentimentTab sentimentData={sentimentData} sentimentColors={sentimentColors} relationshipData={relationshipData} />
          </TabsContent>

          <TabsContent value="triggers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TriggerAnalytics />
              <AdvancedTriggersPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Analytics;
