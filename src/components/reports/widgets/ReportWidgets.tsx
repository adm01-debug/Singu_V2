import { BarChart3, Users, Building2, TrendingUp, Clock, Target, Activity, PieChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { WidgetShell, NumeroGrande } from './WidgetShell';
import {
  useContactsCount, useCompaniesCount, useInteractionsWeek, usePipelineWidget,
  useChurnRiskWidget, useSentimentDistribution, useRecentActivity, useTopContactsByScore,
} from '@/hooks/useReportWidgets';
import { useDailyKpis } from '@/hooks/useDailyKpis';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useBestTimeHeatmap } from '@/hooks/useBestTimeHeatmap';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const ROTULO_ESTAGIO: Record<string, string> = {
  lead: 'Novo Lead', primeiro_contato: '1º Contato', qualificacao: 'Qualificação',
  proposta: 'Proposta', negociacao: 'Negociação', fechamento: 'Fechamento',
  sem_estagio: 'Sem estágio',
};

export function KpisWidget() {
  const { data, isLoading, error } = useDailyKpis();
  return (
    <WidgetShell title="KPIs Diários" icon={BarChart3} isLoading={isLoading} error={error} vazio={!data}
      textoVazio="Os KPIs diários são restritos a administradores.">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xl font-bold tabular-nums">{data?.total_contacts ?? 0}</p><p className="text-[10px] text-muted-foreground">Contatos</p></div>
        <div><p className="text-xl font-bold tabular-nums">{data?.total_companies ?? 0}</p><p className="text-[10px] text-muted-foreground">Empresas</p></div>
        <div><p className="text-xl font-bold tabular-nums">{data?.active_customers ?? 0}</p><p className="text-[10px] text-muted-foreground">Clientes ativos</p></div>
        <div><p className="text-xl font-bold tabular-nums">{data?.interactions_today ?? 0}</p><p className="text-[10px] text-muted-foreground">Interações hoje</p></div>
      </div>
    </WidgetShell>
  );
}

export function ContactsCountWidget() {
  const { data, isLoading, error } = useContactsCount();
  return (
    <WidgetShell title="Total de Contatos" icon={Users} isLoading={isLoading} error={error}>
      <NumeroGrande valor={data ?? 0} legenda="contatos ativos na sua base" />
    </WidgetShell>
  );
}

export function CompaniesCountWidget() {
  const { data, isLoading, error } = useCompaniesCount();
  return (
    <WidgetShell title="Total de Empresas" icon={Building2} isLoading={isLoading} error={error}>
      <NumeroGrande valor={data ?? 0} legenda="empresas ativas na sua base" />
    </WidgetShell>
  );
}

export function InteractionsWeekWidget() {
  const { data, isLoading, error } = useInteractionsWeek();
  const variacao = data && data.semanaAnterior > 0
    ? Math.round(((data.ultimos7 - data.semanaAnterior) / data.semanaAnterior) * 100)
    : null;
  return (
    <WidgetShell title="Interações da Semana" icon={Activity} isLoading={isLoading} error={error}>
      <NumeroGrande
        valor={data?.ultimos7 ?? 0}
        legenda={variacao === null
          ? 'nos últimos 7 dias'
          : `nos últimos 7 dias · ${variacao >= 0 ? '+' : ''}${variacao}% vs semana anterior`}
      />
    </WidgetShell>
  );
}

export function PipelineValueWidget() {
  const { data, isLoading, error } = usePipelineWidget();
  return (
    <WidgetShell title="Valor do Pipeline" icon={TrendingUp} isLoading={isLoading} error={error}>
      <NumeroGrande valor={moeda.format(data?.valorEmAberto ?? 0)} legenda="em negócios ainda abertos" />
    </WidgetShell>
  );
}

export function DealsByStageWidget() {
  const { data, isLoading, error } = usePipelineWidget();
  const estagios = data?.porEstagio ?? [];
  const maior = Math.max(1, ...estagios.map(e => e.valor));
  return (
    <WidgetShell title="Deals por Estágio" icon={PieChart} isLoading={isLoading} error={error}
      vazio={estagios.length === 0} textoVazio="Nenhum negócio em aberto.">
      <div className="space-y-2">
        {estagios.map(e => (
          <div key={e.estagio} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{ROTULO_ESTAGIO[e.estagio] ?? e.estagio}</span>
              <span className="text-muted-foreground tabular-nums">{e.quantidade} · {moeda.format(e.valor)}</span>
            </div>
            <Progress value={(e.valor / maior) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function ChurnRiskWidget() {
  const { data, isLoading, error } = useChurnRiskWidget();
  const contatos = data ?? [];
  return (
    <WidgetShell title="Contatos em Risco" icon={Target} isLoading={isLoading} error={error}
      vazio={contatos.length === 0} textoVazio="Nenhum contato em risco no ranking.">
      <ul className="space-y-1.5">
        {contatos.map(c => (
          <li key={c.contact_id} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate">{c.contact_name ?? 'Sem nome'}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {c.days_since_contact != null ? `${c.days_since_contact}d sem contato` : (c.risk_level ?? 'sem registro')}
            </span>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

export function BestTimeWidget() {
  const { data, loading, error } = useBestTimeHeatmap();
  const celulas = data?.cells ?? [];
  const melhor = celulas.filter(c => c.attempts > 0).sort((a, b) => b.responseRate - a.responseRate)[0];
  return (
    <WidgetShell title="Melhor Horário" icon={Clock} isLoading={loading} error={error}
      vazio={!melhor} textoVazio="Ainda não há interações suficientes para apontar um horário.">
      <NumeroGrande
        valor={melhor ? `${String(melhor.hour).padStart(2, '0')}h` : '—'}
        legenda={melhor ? `${DIAS[melhor.dayOfWeek]} · ${Math.round(melhor.responseRate * 100)}% de resposta` : ''}
      />
    </WidgetShell>
  );
}

export function SentimentDistWidget() {
  const { data, isLoading, error } = useSentimentDistribution();
  const grupos = data ?? [];
  const total = grupos.reduce((s, g) => s + g.total, 0);
  return (
    <WidgetShell title="Distribuição de Sentimento" icon={PieChart} isLoading={isLoading} error={error}
      vazio={total === 0} textoVazio="Nenhuma interação com sentimento classificado.">
      <div className="space-y-2">
        {grupos.map(g => (
          <div key={g.rotulo} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{g.rotulo}</span>
              <span className="text-muted-foreground tabular-nums">{g.total} ({Math.round((g.total / total) * 100)}%)</span>
            </div>
            <Progress value={(g.total / total) * 100} className="h-1.5" />
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function RecentActivityWidget() {
  const { data, isLoading, error } = useRecentActivity();
  const itens = data ?? [];
  return (
    <WidgetShell title="Atividade Recente" icon={Activity} isLoading={isLoading} error={error}
      vazio={itens.length === 0} textoVazio="Nenhuma interação registrada.">
      <ul className="space-y-1.5">
        {itens.map(i => (
          <li key={i.id} className="text-xs">
            <p className="truncate">{i.assunto || i.channel || 'Interação'}</p>
            <p className="text-[10px] text-muted-foreground">
              {i.data_interacao
                ? formatDistanceToNow(new Date(i.data_interacao), { addSuffix: true, locale: ptBR })
                : 'sem data'}
            </p>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

export function TopContactsWidget() {
  const { data, isLoading, error } = useTopContactsByScore();
  const contatos = data ?? [];
  return (
    <WidgetShell title="Top Contatos por Score" icon={Users} isLoading={isLoading} error={error}
      vazio={contatos.length === 0} textoVazio="Nenhum contato com score calculado.">
      <ul className="space-y-1.5">
        {contatos.map(c => (
          <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate">{c.full_name ?? 'Sem nome'}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">{c.relationship_score ?? 0}</span>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

export function TicketsOpenWidget() {
  const { tickets, isLoading } = useSupportTickets();
  const abertos = (tickets ?? []).filter(t => t.status !== 'resolved' && t.status !== 'closed');
  return (
    <WidgetShell title="Tickets Abertos" icon={Target} isLoading={isLoading}>
      <NumeroGrande valor={abertos.length} legenda="chamados ainda não resolvidos" />
    </WidgetShell>
  );
}
