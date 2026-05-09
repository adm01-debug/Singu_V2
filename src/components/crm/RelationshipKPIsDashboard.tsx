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
  ArrowDownRight
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
  CartesianGrid
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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
        .select('relationship_stage, relationship_score, sentiment');
      
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
        stage,
        avg: Math.round(data.total / data.count)
      }));

      const pieData = Object.entries(stageDistribution).map(([name, value]) => ({ name, value }));

      return {
        total: contacts.length,
        atRiskCount: contacts.filter(c => c.relationship_stage === 'at_risk').length,
        avgGlobalScore: Math.round(contacts.reduce((a, b) => a + (b.relationship_score || 0), 0) / contacts.length),
        pieData,
        avgScoreByStage
      };
    }
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Score Médio Global</p>
                <h3 className="text-2xl font-bold text-primary">{stats?.avgGlobalScore}/100</h3>
              </div>
              <Activity className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Contatos em Risco</p>
                <h3 className="text-2xl font-bold text-red-600">{stats?.atRiskCount}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Taxa de Conversão</p>
                <h3 className="text-2xl font-bold text-emerald-600">64%</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Distribuição por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Score Médio por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.avgScoreByStage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" fontSize={10} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {stats?.avgScoreByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
