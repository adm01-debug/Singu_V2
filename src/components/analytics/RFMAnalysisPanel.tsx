import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Trophy, Users, Target, DollarSign, Zap, BarChart3, PieChart as PieChartIcon,
  RefreshCw, Search, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRFMAnalysis } from '@/hooks/useRFMAnalysis';
import { RFM_SEGMENTS, RFMSegment } from '@/types/rfm';
import {
  SEGMENT_ICONS, SEGMENT_COLORS, MetricCard, PriorityCard, SegmentCard,
  ContactRFMCard, ContactRFMDetail, ActionsOverview,
} from './rfm/RFMSubComponents';

interface RFMAnalysisPanelProps {
  compact?: boolean;
  contactId?: string;
}

export function RFMAnalysisPanel({ compact = false, contactId }: RFMAnalysisPanelProps) {
  const { rfmData, contactRFM, history, dashboardStats, contactSummaries, loading, analyzing, runAnalysis, refresh } = useRFMAnalysis(contactId);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredContacts = useMemo(() => {
    return contactSummaries.filter(summary => {
      if (!summary.rfmAnalysis) return false;
      const matchesSearch = summary.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = segmentFilter === 'all' || summary.rfmAnalysis.segment === segmentFilter;
      const matchesPriority = priorityFilter === 'all' || summary.rfmAnalysis.communicationPriority === priorityFilter;
      return matchesSearch && matchesSegment && matchesPriority;
    });
  }, [contactSummaries, searchTerm, segmentFilter, priorityFilter]);

  const segmentChartData = useMemo(() => {
    return Object.entries(dashboardStats.segmentDistribution)
      .filter(([_, count]) => count > 0)
      .map(([segment, count]) => ({ name: RFM_SEGMENTS[segment as RFMSegment].name, value: count, color: SEGMENT_COLORS[segment as RFMSegment] }))
      .sort((a, b) => b.value - a.value);
  }, [dashboardStats.segmentDistribution]);

  const scoreDistributionData = useMemo(() => {
    return [1, 2, 3, 4, 5].map(score => ({
      score: score.toString(),
      Recência: dashboardStats.scoreDistribution.recency[score] || 0,
      Frequência: dashboardStats.scoreDistribution.frequency[score] || 0,
      Monetário: dashboardStats.scoreDistribution.monetary[score] || 0,
    }));
  }, [dashboardStats.scoreDistribution]);

  if (loading) {
    return (
      <Card><CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
        <CardContent><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></CardContent>
      </Card>
    );
  }

  if (contactId && contactRFM) {
    return <ContactRFMDetail rfm={contactRFM} history={history} onRefresh={runAnalysis} analyzing={analyzing} />;
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Análise RFM</CardTitle></div>
            <Button variant="ghost" size="sm" onClick={runAnalysis} disabled={analyzing}><RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success dark:bg-success/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Campeões</div>
              <div className="text-2xl font-bold text-success">{dashboardStats.segmentDistribution.champions || 0}</div>
            </div>
            <div className="bg-destructive dark:bg-destructive/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Em Risco</div>
              <div className="text-2xl font-bold text-destructive">{(dashboardStats.segmentDistribution.at_risk || 0) + (dashboardStats.segmentDistribution.cant_lose || 0)}</div>
            </div>
          </div>
          <div className="space-y-2">
            {segmentChartData.slice(0, 4).map(segment => (
              <div key={segment.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-sm flex-1">{segment.name}</span>
                <span className="text-sm font-medium">{segment.value}</span>
              </div>
            ))}
          </div>
          <Link to="/analytics?tab=rfm"><Button variant="outline" size="sm" className="w-full">Ver Análise Completa<ChevronRight className="h-4 w-4 ml-1" /></Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Análise RFM Completa</h2><p className="text-muted-foreground">Segmentação baseada em Recência, Frequência e Valor Monetário</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          <Button onClick={runAnalysis} disabled={analyzing}>{analyzing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Analisando...</> : <><Zap className="h-4 w-4 mr-2" />Executar Análise</>}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Users className="h-5 w-5" />} label="Contatos Analisados" value={dashboardStats.totalAnalyzed} color="blue" />
        <MetricCard icon={<Target className="h-5 w-5" />} label="Score RFM Médio" value={dashboardStats.averageRfmScore.toFixed(1)} suffix="/15" color="purple" />
        <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Receita em Risco" value={`R$ ${(dashboardStats.atRiskRevenue / 1000).toFixed(1)}k`} color="red" trend="down" />
        <MetricCard icon={<Trophy className="h-5 w-5" />} label="Receita Campeões" value={`R$ ${(dashboardStats.championsRevenue / 1000).toFixed(1)}k`} color="emerald" trend="up" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" />Distribuição por Segmento</CardTitle></CardHeader>
              <CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={segmentChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">{segmentChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Distribuição de Scores</CardTitle></CardHeader>
              <CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={scoreDistributionData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="score" /><YAxis /><RechartsTooltip /><Legend /><Bar dataKey="Recência" fill="#3b82f6" /><Bar dataKey="Frequência" fill="#22c55e" /><Bar dataKey="Monetário" fill="#f59e0b" /></BarChart></ResponsiveContainer></div></CardContent>
            </Card>
          </div>
          <Card><CardHeader><CardTitle>Prioridade de Comunicação</CardTitle><CardDescription>Distribuição de contatos por urgência</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-4 gap-4">
              <PriorityCard label="Urgente" count={dashboardStats.priorityDistribution.urgent} total={dashboardStats.totalAnalyzed} color="red" />
              <PriorityCard label="Alta" count={dashboardStats.priorityDistribution.high} total={dashboardStats.totalAnalyzed} color="orange" />
              <PriorityCard label="Média" count={dashboardStats.priorityDistribution.medium} total={dashboardStats.totalAnalyzed} color="blue" />
              <PriorityCard label="Baixa" count={dashboardStats.priorityDistribution.low} total={dashboardStats.totalAnalyzed} color="gray" />
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(RFM_SEGMENTS).map(([key, segment]) => {
              const count = dashboardStats.segmentDistribution[key as RFMSegment] || 0;
              const percentage = dashboardStats.totalAnalyzed > 0 ? Math.round((count / dashboardStats.totalAnalyzed) * 100) : 0;
              return <SegmentCard key={key} segmentKey={key as RFMSegment} segment={segment} count={count} percentage={percentage} icon={SEGMENT_ICONS[key as RFMSegment]} />;
            })}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar contatos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Segmento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Segmentos</SelectItem>{Object.entries(RFM_SEGMENTS).map(([key, seg]) => <SelectItem key={key} value={key}>{seg.name}</SelectItem>)}</SelectContent></Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Prioridade" /></SelectTrigger><SelectContent><SelectItem value="all">Todas Prioridades</SelectItem><SelectItem value="urgent">Urgente</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="low">Baixa</SelectItem></SelectContent></Select>
          </div>
          <ScrollArea className="h-[600px]"><div className="space-y-3">{filteredContacts.map(summary => <ContactRFMCard key={summary.contactId} summary={summary} />)}{filteredContacts.length === 0 && <div className="text-center py-12 text-muted-foreground">Nenhum contato encontrado</div>}</div></ScrollArea>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4"><ActionsOverview rfmData={rfmData} /></TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default RFMAnalysisPanel;
