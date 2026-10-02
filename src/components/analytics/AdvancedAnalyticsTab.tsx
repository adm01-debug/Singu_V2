import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Trophy, Flame, TrendingUp, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { useCompanies } from '@/hooks/useCompanies';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ===================== RELATIONSHIP FUNNEL =====================

function RelationshipFunnel() {
  const { contacts, loading } = useContacts(undefined, { fetchAll: true });

  const funnelData = useMemo(() => {
    if (!contacts.length) return [];
    const stages: Record<string, { name: string; color: string }> = {
      lead: { name: 'Lead', color: 'hsl(var(--muted-foreground))' },
      prospect: { name: 'Prospect', color: 'hsl(215, 60%, 55%)' },
      active: { name: 'Ativo', color: 'hsl(var(--primary))' },
      advocate: { name: 'Advocate', color: 'hsl(142, 76%, 36%)' },
    };
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      const stage = c.relationship_stage || 'lead';
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(stages).map(([key, meta]) => ({
      name: meta.name,
      value: counts[key] || 0,
      fill: meta.color,
    }));
  }, [contacts]);

  if (loading) return <Skeleton className="h-80" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Funil de Relacionamento
        </CardTitle>
        <CardDescription className="text-xs">Distribuição por estágio</CardDescription>
      </CardHeader>
      <CardContent>
        {funnelData.length > 0 ? (
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxVal = Math.max(...funnelData.map(d => d.value), 1);
              const pct = Math.round((stage.value / maxVal) * 100);
              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{stage.name}</span>
                    <span className="text-muted-foreground">{stage.value} contatos</span>
                  </div>
                  <div className="h-8 rounded-md overflow-hidden bg-muted/40">
                    <motion.div
                      className="h-full rounded-md"
                      style={{ backgroundColor: stage.fill, width: `${pct}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">Sem dados de estágio</p>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== ACTIVITY HEATMAP =====================

function ActivityHeatmap() {
  const { interactions, loading } = useInteractions();

  const heatmapData = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    interactions.forEach(i => {
      const d = new Date(i.created_at);
      grid[d.getDay()][d.getHours()]++;
    });
    return grid;
  }, [interactions]);

  const maxVal = useMemo(() => Math.max(...heatmapData.flat(), 1), [heatmapData]);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) return <Skeleton className="h-80" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="w-4 h-4 text-warning" />
          Heatmap de Atividade
        </CardTitle>
        <CardDescription className="text-xs">Horários com mais interações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hours header */}
            <div className="flex ml-10 mb-1">
              {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                <span key={h} className="text-[10px] text-muted-foreground" style={{ width: `${(3 / 24) * 100}%` }}>
                  {String(h).padStart(2, '0')}h
                </span>
              ))}
            </div>
            {/* Grid */}
            {heatmapData.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-1 mb-[2px]">
                <span className="text-[10px] text-muted-foreground w-8 text-right">{days[dayIdx]}</span>
                <div className="flex-1 flex gap-[1px]">
                  {row.map((val, hourIdx) => {
                    const intensity = val / maxVal;
                    return (
                      <div
                        key={hourIdx}
                        className="flex-1 h-5 rounded-sm transition-colors"
                        style={{
                          backgroundColor: intensity === 0
                            ? 'hsl(var(--muted) / 0.3)'
                            : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                        }}
                        title={`${days[dayIdx]} ${hourIdx}h: ${val} interações`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[10px] text-muted-foreground">Menos</span>
              {[0.1, 0.3, 0.5, 0.7, 1].map((v, i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${0.15 + v * 0.85})` }} />
              ))}
              <span className="text-[10px] text-muted-foreground">Mais</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== CONTACT RANKING =====================

function ContactRanking() {
  const { contacts, loading } = useContacts(undefined, { fetchAll: true });
  const { companies } = useCompanies();
  const { interactions } = useInteractions();

  const ranked = useMemo(() => {
    return [...contacts]
      .filter(c => c.relationship_score != null)
      .sort((a, b) => (b.relationship_score || 0) - (a.relationship_score || 0))
      .slice(0, 10)
      .map((c, idx) => {
        const company = companies.find(co => co.id === c.company_id);
        const count = interactions.filter(i => i.contact_id === c.id).length;
        return { ...c, rank: idx + 1, companyName: company?.name || '', interactionCount: count };
      });
  }, [contacts, companies, interactions]);

  if (loading) return <Skeleton className="h-96" />;

  const medalColors = ['text-warning', 'text-muted-foreground', 'text-warning'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          Top Contatos por Score
        </CardTitle>
        <CardDescription className="text-xs">Ranking de relacionamento</CardDescription>
      </CardHeader>
      <CardContent>
        {ranked.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Sem contatos com score</p>
        ) : (
          <div className="space-y-2">
            {ranked.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <span className={cn("text-lg font-bold w-6 text-center", c.rank <= 3 ? medalColors[c.rank - 1] : 'text-muted-foreground')}>
                  {c.rank <= 3 ? ['🥇', '🥈', '🥉'][c.rank - 1] : c.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.companyName || c.role_title || 'Contato'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{c.relationship_score}</p>
                  <p className="text-[10px] text-muted-foreground">{c.interactionCount} int.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== INTERACTIONS PER WEEK CHART =====================

function InteractionsPerWeekChart() {
  const { interactions, loading } = useInteractions();

  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = `S${12 - i}`;
      weeks[key] = 0;
    }
    interactions.forEach(inter => {
      const date = new Date(inter.created_at);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 12) {
        const key = `S${12 - weekIdx}`;
        if (weeks[key] !== undefined) weeks[key]++;
      }
    });
    return Object.entries(weeks).map(([name, value]) => ({ name, value }));
  }, [interactions]);

  if (loading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Interações por Semana
        </CardTitle>
        <CardDescription className="text-xs">Últimas 12 semanas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Interações" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ===================== SENTIMENT EVOLUTION CHART =====================

function SentimentEvolutionChart() {
  const { contacts, loading } = useContacts(undefined, { fetchAll: true });

  const sentimentData = useMemo(() => {
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    contacts.forEach(c => {
      const s = c.sentiment || 'neutral';
      if (s === 'positive' || s === 'positivo') sentiments.positive++;
      else if (s === 'negative' || s === 'negativo') sentiments.negative++;
      else sentiments.neutral++;
    });
    return [
      { name: 'Positivo', value: sentiments.positive, fill: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: sentiments.neutral, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Negativo', value: sentiments.negative, fill: 'hsl(0, 84%, 60%)' },
    ];
  }, [contacts]);

  if (loading) return <Skeleton className="h-64" />;
  const total = sentimentData.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          Sentimento do Portfólio
        </CardTitle>
        <CardDescription className="text-xs">Distribuição atual dos contatos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sentimentData.map(s => (
            <div key={s.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.value} ({Math.round((s.value / total) * 100)}%)</span>
              </div>
              <Progress value={(s.value / total) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== MAIN EXPORT =====================

export default function AdvancedAnalyticsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Row 1: Funnel + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RelationshipFunnel />
        <ContactRanking />
      </div>

      {/* Row 2: Weekly chart + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractionsPerWeekChart />
        <SentimentEvolutionChart />
      </div>

      {/* Row 3: Heatmap */}
      <ActivityHeatmap />
    </motion.div>
  );
}
