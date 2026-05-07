import { Users, UserCheck, UserX, MessageSquare, TrendingUp, Building2, DollarSign, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useTeamDashboard } from '@/hooks/useTeamDashboard';

export function TeamDashboardPanel() {
  const { data, isLoading } = useTeamDashboard();

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />;
  if (!data?.isManager || !data.members.length) return null;

  const totalContacts = data.members.reduce((s, m) => s + m.contacts_count, 0);
  const totalInteractions = data.members.reduce((s, m) => s + m.interactions_this_month, 0);
  const totalPipeline = data.members.reduce((s, m) => s + m.pipeline_value, 0);
  const totalWon = data.members.reduce((s, m) => s + m.won_deals_value, 0);
  
  const onVacation = data.members.filter(m => m.is_on_vacation).length;
  const active = data.members.length - onVacation;

  const sortedByWon = [...data.members].sort((a, b) => b.won_deals_value - a.won_deals_value);
  const maxWon = Math.max(...data.members.map(m => m.won_deals_value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          Visão do Time ({data.members.length} membros)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Ativos', value: active, icon: UserCheck, color: 'text-green-500' },
            { label: 'Férias', value: onVacation, icon: UserX, color: 'text-orange-500' },
            { label: 'Contatos Total', value: totalContacts, icon: Building2, color: 'text-blue-500' },
            { label: 'Interações/Mês', value: totalInteractions, icon: MessageSquare, color: 'text-purple-500' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Member list */}
        <div className="space-y-1.5">
          {data.members.map(member => (
            <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${member.is_on_vacation ? 'bg-orange-500' : 'bg-green-500'}`} />
                <div>
                  <p className="text-xs font-medium">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />{member.contacts_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />{member.interactions_this_month}
                </span>
                {member.is_on_vacation && <Badge variant="outline" className="text-[10px] h-4">Férias</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
