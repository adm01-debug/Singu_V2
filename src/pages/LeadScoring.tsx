import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, RefreshCw, Settings2, Zap } from 'lucide-react';
import {
  useTopLeads,
  useLeadScoreDistribution,
  useRecomputeAllLeads,
  type LeadScoreGrade,
} from '@/hooks/useLeadScoring';
import { TopLeadsTable } from '@/components/lead-scoring/TopLeadsTable';
import { ScoreDistributionChart } from '@/components/lead-scoring/ScoreDistributionChart';

export default function LeadScoringPage() {
  const [grade, setGrade] = useState<LeadScoreGrade | 'all'>('all');
  const { data: dist } = useLeadScoreDistribution();
  const { data: rows = [], isLoading } = useTopLeads(grade, 50);
  const recomputeAll = useRecomputeAllLeads();

  return (
    <>
      <Helmet>
        <title>Lead Scoring | SINGU CRM</title>
        <meta name="description" content="Hub de Lead Scoring server-side com decay temporal, grades A/B/C/D e ranking de top leads." />
      </Helmet>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Gauge className="h-6 w-6 text-primary" /> Lead Scoring
            </h1>
            <p className="text-sm text-muted-foreground">Pontuação automática com decay temporal por dimensão.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to="/lead-scoring/automations"><Zap className="h-4 w-4 mr-2" />Automações</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/lead-scoring/config"><Settings2 className="h-4 w-4 mr-2" />Configurar</Link>
            </Button>
            <Button onClick={() => recomputeAll.mutate(100)} disabled={recomputeAll.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${recomputeAll.isPending ? 'animate-spin' : ''}`} />
              Recalcular fila
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total pontuado</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{dist?.total ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Score médio</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{dist?.avg ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Grade A (Hot)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-500">{dist?.A ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Mudanças 24h</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{dist?.changes24h ?? 0}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Top Leads</CardTitle>
                  <Tabs value={grade} onValueChange={v => setGrade(v as LeadScoreGrade | 'all')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                      <TabsTrigger value="A" className="text-xs">A</TabsTrigger>
                      <TabsTrigger value="B" className="text-xs">B</TabsTrigger>
                      <TabsTrigger value="C" className="text-xs">C</TabsTrigger>
                      <TabsTrigger value="D" className="text-xs">D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
                  : <TopLeadsTable rows={rows} />}
              </CardContent>
            </Card>
          </div>
          <ScoreDistributionChart distribution={{ A: dist?.A ?? 0, B: dist?.B ?? 0, C: dist?.C ?? 0, D: dist?.D ?? 0 }} />
        </div>
      </div>
    </>
  );
}
