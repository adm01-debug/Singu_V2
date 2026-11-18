import type { PeriodFilter } from '@/lib/tab-utils';
import type { ResumoAtividade } from '@/hooks/useActivityOverview';

/**
 * Transformações puras do resultado de get_activity_overview para o formato que
 * os gráficos de /analytics esperam.
 *
 * Este arquivo tinha 213 linhas de número cravado: séries de evolução, divisão
 * de sentimento, engajamento por canal, radar e uma lista de "top performers"
 * com pessoas inventadas (João Silva, Maria Santos...). Tudo isso era idêntico
 * para qualquer usuário e para qualquer base. Agora só restam conversões do
 * dado real que a RPC devolve.
 */

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
};

export const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

export const getSentimentColors = () => ({
  Positivo: 'hsl(var(--success))',
  Neutro: 'hsl(var(--muted-foreground))',
  Negativo: 'hsl(var(--destructive))',
  'Não classificado': 'hsl(var(--border))',
});

const ROTULO_CANAL: Record<string, string> = {
  email: 'Email',
  telefone: 'Ligação',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  comercial: 'Comercial',
  redes_sociais: 'Redes sociais',
  sistema: 'Sistema',
  sem_canal: 'Sem canal',
};

const ROTULO_SENTIMENTO: Record<string, string> = {
  positivo: 'Positivo',
  positive: 'Positivo',
  neutral: 'Neutro',
  neutro: 'Neutro',
  negativo: 'Negativo',
  negative: 'Negativo',
  nao_classificado: 'Não classificado',
};

const MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function rotuloDoPonto(iso: string, bucket: ResumoAtividade['periodo']['bucket']): string {
  const d = new Date(iso);
  if (bucket === 'day') return DIA_CURTO[d.getUTCDay()];
  if (bucket === 'month') return MES_CURTO[d.getUTCMonth()];
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export interface PontoEvolucao {
  date: string;
  interactions: number;
  newContacts: number;
}

/** Série de interações e contatos alcançados por bucket do período. */
export const toRelationshipEvolution = (dados?: ResumoAtividade): PontoEvolucao[] =>
  (dados?.serie ?? []).map(p => ({
    date: rotuloDoPonto(p.inicio, dados!.periodo.bucket),
    interactions: p.interacoes,
    newContacts: p.contatos,
  }));

export interface FatiaSentimento { name: string; value: number }

export const toSentimentDistribution = (dados?: ResumoAtividade): FatiaSentimento[] =>
  (dados?.por_sentimento ?? []).map(s => ({
    name: ROTULO_SENTIMENTO[s.sentimento] ?? s.sentimento,
    value: s.total,
  }));

export interface EngajamentoCanal {
  channel: string;
  sent: number;
  received: number;
  rate: number;
}

/** `rate` é a taxa real de resposta: recebidas sobre enviadas, limitada a 100. */
export const toEngagementByChannel = (dados?: ResumoAtividade): EngajamentoCanal[] =>
  (dados?.por_canal ?? []).map(c => ({
    channel: ROTULO_CANAL[c.canal] ?? c.canal,
    sent: c.enviadas,
    received: c.recebidas,
    rate: c.enviadas > 0 ? Math.min(100, Math.round((c.recebidas / c.enviadas) * 100)) : 0,
  }));

export interface AtividadeDiaSemana { dia: string; interacoes: number }

export const toWeekdayActivity = (dados?: ResumoAtividade): AtividadeDiaSemana[] => {
  const porDia = new Map((dados?.por_dia_semana ?? []).map(d => [d.dia, d.total]));
  return DIA_CURTO.map((rotulo, indice) => ({ dia: rotulo, interacoes: porDia.get(indice) ?? 0 }));
};

export interface MetricasPeriodo {
  totalInteractions: PeriodComparison;
  contatosAlcancados: PeriodComparison;
  taxaPositiva: PeriodComparison;
  recebidas: PeriodComparison;
}

function taxaPositiva(dados?: ResumoAtividade): number {
  const total = dados?.totais.interacoes ?? 0;
  if (total === 0) return 0;
  const positivas = (dados?.por_sentimento ?? [])
    .filter(s => s.sentimento === 'positivo' || s.sentimento === 'positive')
    .reduce((soma, s) => soma + s.total, 0);
  return Math.round((positivas / total) * 100);
}

export const toMetricsStats = (
  atual?: ResumoAtividade,
  anterior?: ResumoAtividade,
): MetricasPeriodo => ({
  totalInteractions: calcChange(atual?.totais.interacoes ?? 0, anterior?.totais.interacoes ?? 0),
  contatosAlcancados: calcChange(atual?.totais.contatos_alcancados ?? 0, anterior?.totais.contatos_alcancados ?? 0),
  taxaPositiva: calcChange(taxaPositiva(atual), taxaPositiva(anterior)),
  recebidas: calcChange(atual?.totais.recebidas ?? 0, anterior?.totais.recebidas ?? 0),
});

export type { PeriodFilter };
