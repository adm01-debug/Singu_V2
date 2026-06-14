import { Users, UserCheck, MessageSquare, TrendingUp, DollarSign, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';

export function TeamDashboardPanel() {
  const { data, isLoading } = useTeamDashboard();

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />;
  if (!data?.isManager || !data.members.length) return null;

  const totalInteractions = data.members.reduce((s, m) => s + m.interactions_this_month, 0);
  const totalPipeline = data.members.reduce((s, m) => s + m.pipeline_value, 0);
  const totalWon = data.members.reduce((s, m) => s + m.won_deals_value, 0);
  
  const onVacation = data.members.filter(m => m.is_on_vacation).length;
  const active = data.members.length - onVacation;

  const sortedByWon = [...data.members].sort((a, b) => b.won_deals_value - a.won_deals_value);
  const maxWon = Math.max(...data.members.map(m => m.won_deals_value), 1);

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Performance do Time ({data.members.length} membros)
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Total Won: R$ {totalWon.toLocaleString('pt-BR')}
            </Badge>
          </div>
        </div>
        <CardDescription>Visão consolidada de atividades e resultados financeiros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pipeline Total', value: `R$ ${(totalPipeline / 1000).toFixed(1)}k`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Deals Fechados', value: `R$ ${(totalWon / 1000).toFixed(1)}k`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Membros Ativos', value: `${active}/${data.members.length}`, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Interações (30d)', value: totalInteractions, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg} border border-border/50`}>
              <div className={`p-2 rounded-lg bg-background shadow-sm`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Member Leaderboard */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-3 w-3" /> Ranking de Vendas
          </h4>
          <div className="space-y-3">
            {sortedByWon.map((member, idx) => (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}.</span>
                    <span className="font-medium text-xs">{member.name}</span>
                    {member.is_on_vacation && <Badge variant="outline" className="text-[9px] h-4 py-0 leading-none">FÉRIAS</Badge>}
                  </div>
                  <span className="text-xs font-bold">R$ {member.won_deals_value.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={(member.won_deals_value / maxWon) * 100} className="h-1.5 flex-1" />
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground w-20 justify-end">
                    <span className="flex items-center gap-0.5"><DollarSign className="h-2 w-2" />{member.deals_count}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="h-2 w-2" />{member.interactions_this_month}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
