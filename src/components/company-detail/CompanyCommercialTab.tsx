import { motion } from 'framer-motion';
import { DollarSign, FileText, CalendarDays, CheckSquare, Activity, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useCompanyDeals, useCompanyProposals, useCompanyMeetings, useCompanyTasks } from '@/hooks/useCompanyCommercial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  companyId: string;
}

const formatCurrency = (v?: number) => v != null ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
const formatDate = (d?: string) => d ? format(new Date(d), 'dd/MM/yy', { locale: ptBR }) : '—';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const dealStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  open: { label: 'Aberto', variant: 'outline' },
  won: { label: 'Ganho', variant: 'default' },
  lost: { label: 'Perdido', variant: 'destructive' },
  negotiation: { label: 'Negociação', variant: 'secondary' },
  aberto: { label: 'Aberto', variant: 'outline' },
  ganho: { label: 'Ganho', variant: 'default' },
  perdido: { label: 'Perdido', variant: 'destructive' },
  negociando: { label: 'Negociação', variant: 'secondary' },
  proposta: { label: 'Proposta', variant: 'secondary' },
  arquivado: { label: 'Arquivado', variant: 'outline' },
};

const proposalStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  sent: { label: 'Enviada', variant: 'secondary' },
  viewed: { label: 'Visualizada', variant: 'secondary' },
  accepted: { label: 'Aceita', variant: 'default' },
  rejected: { label: 'Rejeitada', variant: 'destructive' },
};

const taskStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendente', variant: 'outline' },
  in_progress: { label: 'Em Progresso', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export function CompanyCommercialTab({ companyId }: Props) {
  const { data: deals = [], isLoading: dealsLoading, error: dealsError, refetch: refetchDeals } = useCompanyDeals(companyId);
  const { data: proposals = [], isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useCompanyProposals(companyId);
  const { data: meetings = [], isLoading: meetingsLoading, error: meetingsError, refetch: refetchMeetings } = useCompanyMeetings(companyId);
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useCompanyTasks(companyId);

  // KPIs
  const openDeals = deals.filter(d => !['won', 'lost', 'ganho', 'perdido', 'arquivado'].includes(d.status || ''));
  const wonDeals = deals.filter(d => ['won', 'ganho'].includes(d.status || ''));
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.valor || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.valor || 0), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const upcomingMeetings = meetings.filter(m => m.scheduled_at && new Date(m.scheduled_at) > new Date());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3.5 w-3.5" /> Pipeline
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(pipelineValue)}</p>
            <p className="text-[10px] text-muted-foreground">{openDeals.length} negócio(s) aberto(s)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Receita Ganha
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(wonValue)}</p>
            <p className="text-[10px] text-muted-foreground">{wonDeals.length} negócio(s) ganho(s)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CalendarDays className="h-3.5 w-3.5" /> Reuniões
            </div>
            <p className="text-xl font-bold text-foreground">{meetings.length}</p>
            <p className="text-[10px] text-muted-foreground">{upcomingMeetings.length} próxima(s)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckSquare className="h-3.5 w-3.5" /> Tarefas
            </div>
            <p className="text-xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-[10px] text-muted-foreground">{pendingTasks.length} pendente(s)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals */}
        <ExternalDataCard title="Negócios" icon={<DollarSign className="h-4 w-4" />} isLoading={dealsLoading} error={dealsError} onRetry={refetchDeals} hasData={!!deals.length} emptyMessage="Nenhum negócio vinculado">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Negócios</span>
                <Badge variant="outline" className="text-[10px]">{deals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {deals.map(d => {
                  const cfg = dealStatusConfig[d.status || ''] || dealStatusConfig.open;
                  return (
                    <div key={d.id} className="p-2.5 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{d.titulo}</span>
                        <Badge variant={cfg.variant} className="text-[10px] ml-2 shrink-0">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(d.valor)}</span>
                        {d.probabilidade != null && <span>{d.probabilidade}%</span>}
                        <span>{formatDate(d.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </ExternalDataCard>

        {/* Proposals */}
        <ExternalDataCard title="Propostas" icon={<FileText className="h-4 w-4" />} isLoading={proposalsLoading} error={proposalsError} onRetry={refetchProposals} hasData={!!proposals.length} emptyMessage="Nenhuma proposta vinculada">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Propostas</span>
                <Badge variant="outline" className="text-[10px]">{proposals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {proposals.map(p => {
                  const cfg = proposalStatusConfig[p.status || ''] || proposalStatusConfig.draft;
                  return (
                    <div key={p.id} className="p-2.5 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{p.title}</span>
                        <Badge variant={cfg.variant} className="text-[10px] ml-2 shrink-0">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(p.value)}</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </ExternalDataCard>

        {/* Meetings */}
        <ExternalDataCard title="Reuniões" icon={<CalendarDays className="h-4 w-4" />} isLoading={meetingsLoading} error={meetingsError} onRetry={refetchMeetings} hasData={!!meetings.length} emptyMessage="Nenhuma reunião registrada">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Reuniões</span>
                <Badge variant="outline" className="text-[10px]">{meetings.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {meetings.map(m => (
                  <div key={m.id} className="p-2.5 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{m.title}</span>
                      {m.status && <Badge variant="secondary" className="text-[10px] ml-2 shrink-0">{m.status}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {m.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(m.scheduled_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      {m.duration_minutes && <span>{m.duration_minutes}min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ExternalDataCard>

        {/* Tasks */}
        <ExternalDataCard title="Tarefas" icon={<CheckSquare className="h-4 w-4" />} isLoading={tasksLoading} error={tasksError} onRetry={refetchTasks} hasData={!!tasks.length} emptyMessage="Nenhuma tarefa vinculada">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tarefas</span>
                <Badge variant="outline" className="text-[10px]">{tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {tasks.map(t => {
                  const cfg = taskStatusConfig[t.status || ''] || taskStatusConfig.pending;
                  return (
                    <div key={t.id} className="p-2.5 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{t.title}</span>
                        <Badge variant={cfg.variant} className="text-[10px] ml-2 shrink-0">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {t.due_date && <span>Vence: {formatDate(t.due_date)}</span>}
                        {t.priority && <span className="capitalize">{t.priority}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </ExternalDataCard>
      </div>

      {/* Sales Activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" /> Atividades de Vendas
          </CardTitle>
          <CardDescription className="text-xs">Histórico por empresa indisponível</CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status" className="text-sm text-muted-foreground">
            O banco ainda não possui um vínculo entre atividades de vendas e empresas. As atividades não podem ser atribuídas com segurança a esta empresa.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
