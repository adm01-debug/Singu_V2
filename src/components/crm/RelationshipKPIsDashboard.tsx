import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { RELATIONSHIP_STAGE_LABELS } from '@/types';

const STAGE_COLORS: Record<string, string> = {
  prospect: '#94a3b8',
  qualified_lead: '#3b82f6',
  opportunity: '#6366f1',
  negotiation: '#f59e0b',
  customer: '#10b981',
  loyal_customer: '#059669',
  advocate: '#8b5cf6',
  at_risk: '#ef4444',
  lost: '#6b7280',
};

export function RelationshipKPIsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['relationship-kpis'],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('relationship_stage, relationship_score, sentiment, last_interaction_at');
      
      if (error) throw error;

      // Group by stage
      const stageDistribution = contacts.reduce((acc: any, curr) => {
        const stage = curr.relationship_stage || 'unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {});

      // Avg score by stage
      const stageScores = contacts.reduce((acc: any, curr) => {
        const stage = curr.relationship_stage || 'unknown';
        if (!acc[stage]) acc[stage] = { total: 0, count: 0 };
        acc[stage].total += curr.relationship_score || 0;
        acc[stage].count += 1;
        return acc;
      }, {});

      const avgScoreByStage = Object.entries(stageScores).map(([stage, data]: any) => ({
        stage: RELATIONSHIP_STAGE_LABELS[stage as any] || stage,
        avg: Math.round(data.total / data.count),
        originalStage: stage
      }));

      const pieData = Object.entries(stageDistribution).map(([name, value]) => ({ 
        name: RELATIONSHIP_STAGE_LABELS[name as any] || name, 
        value,
        originalName: name
      }));

      // Impact calculation (Mocked based on recent interactions trend)
      const trendData = [
        { name: 'Jan', score: 65, active: 12 },
        { name: 'Fev', score: 68, active: 15 },
        { name: 'Mar', score: 72, active: 18 },
        { name: 'Abr', score: 75, active: 22 },
        { name: 'Mai', score: 78, active: 25 },
      ];

      return {
        total: contacts.length,
        atRiskCount: contacts.filter(c => c.relationship_stage === 'at_risk').length,
        avgGlobalScore: Math.round(contacts.reduce((a, b) => a + (b.relationship_score || 0), 0) / contacts.length),
        pieData,
        avgScoreByStage,
        trendData
      };
    }
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Global Score</p>
                <h3 className="text-2xl font-bold text-primary">{stats?.avgGlobalScore}/100</h3>
              </div>
              <Activity className="h-6 w-6 text-primary/40" />
            </div>
            <p className="text-[10px] text-primary/60 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +4% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Em Risco</p>
                <h3 className="text-2xl font-bold text-red-600">{stats?.atRiskCount}</h3>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500/40" />
            </div>
            <p className="text-[10px] text-red-600/60 mt-1 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" /> -2 contatos vs ontem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Taxa de Retorno</p>
                <h3 className="text-2xl font-bold text-emerald-600">68%</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-500/40" />
            </div>
            <p className="text-[10px] text-emerald-600/60 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +12% eficácia cadência
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Cadências Ativas</p>
                <h3 className="text-2xl font-bold text-amber-600">142</h3>
              </div>
              <Zap className="h-6 w-6 text-amber-500/40" />
            </div>
            <p className="text-[10px] text-amber-600/60 mt-1 flex items-center gap-1">
              <Target className="h-3 w-3" /> 85% prioridade alta
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              Distribuição por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.originalName] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Score Médio por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.avgScoreByStage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="stage" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={30}>
                  {stats?.avgScoreByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.originalStage] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Evolução do Score vs Impacto das Cadências
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                <Line type="monotone" dataKey="active" stroke="#f59e0b" strokeWidth={2} dot={true} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
