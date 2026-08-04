import type { PeriodFilter } from '@/lib/tab-utils';

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

export const getRelationshipEvolutionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { date: 'Seg', score: 71, newContacts: 2, interactions: 8 },
      { date: 'Ter', score: 72, newContacts: 1, interactions: 12 },
      { date: 'Qua', score: 73, newContacts: 3, interactions: 15 },
      { date: 'Qui', score: 72, newContacts: 0, interactions: 10 },
      { date: 'Sex', score: 74, newContacts: 2, interactions: 18 },
      { date: 'Sab', score: 74, newContacts: 0, interactions: 3 },
      { date: 'Dom', score: 75, newContacts: 0, interactions: 2 },
    ],
    '30d': [
      { date: 'Sem 1', score: 68, newContacts: 5, interactions: 42 },
      { date: 'Sem 2', score: 70, newContacts: 8, interactions: 55 },
      { date: 'Sem 3', score: 72, newContacts: 6, interactions: 48 },
      { date: 'Sem 4', score: 75, newContacts: 7, interactions: 62 },
    ],
    '90d': [
      { date: 'Out', score: 65, newContacts: 18, interactions: 145 },
      { date: 'Nov', score: 70, newContacts: 22, interactions: 178 },
      { date: 'Dez', score: 75, newContacts: 15, interactions: 162 },
    ],
    '365d': [
      { date: 'Jan', score: 55, newContacts: 12, interactions: 98 },
      { date: 'Fev', score: 58, newContacts: 15, interactions: 110 },
      { date: 'Mar', score: 60, newContacts: 18, interactions: 125 },
      { date: 'Abr', score: 62, newContacts: 14, interactions: 118 },
      { date: 'Mai', score: 65, newContacts: 20, interactions: 142 },
      { date: 'Jun', score: 67, newContacts: 22, interactions: 155 },
      { date: 'Jul', score: 68, newContacts: 16, interactions: 138 },
      { date: 'Ago', score: 70, newContacts: 19, interactions: 148 },
      { date: 'Set', score: 72, newContacts: 21, interactions: 165 },
      { date: 'Out', score: 73, newContacts: 18, interactions: 152 },
      { date: 'Nov', score: 74, newContacts: 23, interactions: 178 },
      { date: 'Dez', score: 75, newContacts: 15, interactions: 162 },
    ],
    'all': [],
  };
  return dataByPeriod[period] || dataByPeriod['30d'];
};

export const getSentimentDistributionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Positivo', value: 45, prevValue: 42 },
      { name: 'Neutro', value: 35, prevValue: 38 },
      { name: 'Negativo', value: 8, prevValue: 10 },
    ],
    '30d': [
      { name: 'Positivo', value: 52, prevValue: 45 },
      { name: 'Neutro', value: 42, prevValue: 45 },
      { name: 'Negativo', value: 12, prevValue: 16 },
    ],
    '90d': [
      { name: 'Positivo', value: 68, prevValue: 55 },
      { name: 'Neutro', value: 55, prevValue: 60 },
      { name: 'Negativo', value: 18, prevValue: 25 },
    ],
    '365d': [
      { name: 'Positivo', value: 285, prevValue: 240 },
      { name: 'Neutro', value: 220, prevValue: 250 },
      { name: 'Negativo', value: 65, prevValue: 85 },
    ],
    'all': [],
  };
  return dataByPeriod[period] || dataByPeriod['30d'];
};

export const getSentimentColors = () => ({
  Positivo: 'hsl(142, 76%, 36%)',
  Neutro: 'hsl(215, 16%, 47%)',
  Negativo: 'hsl(0, 84%, 60%)',
});

export const getEngagementByChannelData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { channel: 'Email', sent: 17, received: 12, rate: 71 },
      { channel: 'Reunião', sent: 8, received: 8, rate: 100 },
      { channel: 'Ligação', sent: 10, received: 6, rate: 60 },
      { channel: 'WhatsApp', sent: 25, received: 22, rate: 88 },
    ],
    '30d': [
      { channel: 'Email', sent: 65, received: 48, rate: 74 },
      { channel: 'Reunião', sent: 28, received: 28, rate: 100 },
      { channel: 'Ligação', sent: 42, received: 28, rate: 67 },
      { channel: 'WhatsApp', sent: 95, received: 82, rate: 86 },
    ],
    '90d': [
      { channel: 'Email', sent: 185, received: 142, rate: 77 },
      { channel: 'Reunião', sent: 75, received: 75, rate: 100 },
      { channel: 'Ligação', sent: 118, received: 82, rate: 69 },
      { channel: 'WhatsApp', sent: 265, received: 235, rate: 89 },
    ],
    '365d': [
      { channel: 'Email', sent: 720, received: 548, rate: 76 },
      { channel: 'Reunião', sent: 285, received: 285, rate: 100 },
      { channel: 'Ligação', sent: 465, received: 325, rate: 70 },
      { channel: 'WhatsApp', sent: 1050, received: 920, rate: 88 },
    ],
    'all': [],
  };
  return dataByPeriod[period] || dataByPeriod['30d'];
};

export const getEngagementRadarData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { metric: 'Frequência', value: 75, fullMark: 100 },
      { metric: 'Resposta', value: 82, fullMark: 100 },
      { metric: 'Qualidade', value: 68, fullMark: 100 },
      { metric: 'Proatividade', value: 55, fullMark: 100 },
      { metric: 'Follow-up', value: 72, fullMark: 100 },
      { metric: 'Conversão', value: 45, fullMark: 100 },
    ],
    '30d': [
      { metric: 'Frequência', value: 78, fullMark: 100 },
      { metric: 'Resposta', value: 85, fullMark: 100 },
      { metric: 'Qualidade', value: 72, fullMark: 100 },
      { metric: 'Proatividade', value: 62, fullMark: 100 },
      { metric: 'Follow-up', value: 78, fullMark: 100 },
      { metric: 'Conversão', value: 52, fullMark: 100 },
    ],
    '90d': [
      { metric: 'Frequência', value: 82, fullMark: 100 },
      { metric: 'Resposta', value: 88, fullMark: 100 },
      { metric: 'Qualidade', value: 76, fullMark: 100 },
      { metric: 'Proatividade', value: 68, fullMark: 100 },
      { metric: 'Follow-up', value: 82, fullMark: 100 },
      { metric: 'Conversão', value: 58, fullMark: 100 },
    ],
    '365d': [
      { metric: 'Frequência', value: 85, fullMark: 100 },
      { metric: 'Resposta', value: 90, fullMark: 100 },
      { metric: 'Qualidade', value: 80, fullMark: 100 },
      { metric: 'Proatividade', value: 72, fullMark: 100 },
      { metric: 'Follow-up', value: 85, fullMark: 100 },
      { metric: 'Conversão', value: 65, fullMark: 100 },
    ],
    'all': [],
  };
  return dataByPeriod[period] || dataByPeriod['30d'];
};

export const getTopPerformersData = () => [
  { name: 'João Silva', score: 92, interactions: 45, sentiment: 'positivo' },
  { name: 'Maria Santos', score: 88, interactions: 38, sentiment: 'positivo' },
  { name: 'Pedro Costa', score: 85, interactions: 32, sentiment: 'neutro' },
  { name: 'Ana Oliveira', score: 82, interactions: 28, sentiment: 'positivo' },
  { name: 'Carlos Lima', score: 78, interactions: 25, sentiment: 'neutro' },
];

export const getMetricsStats = (period: PeriodFilter) => {
  const statsByPeriod = {
    '7d': {
      totalInteractions: calcChange(68, 55),
      avgScore: calcChange(75, 71),
      positiveRate: calcChange(54, 48),
      engagementRate: calcChange(78, 72),
    },
    '30d': {
      totalInteractions: calcChange(207, 175),
      avgScore: calcChange(75, 68),
      positiveRate: calcChange(49, 42),
      engagementRate: calcChange(82, 75),
    },
    '90d': {
      totalInteractions: calcChange(485, 420),
      avgScore: calcChange(75, 65),
      positiveRate: calcChange(48, 40),
      engagementRate: calcChange(85, 78),
    },
    '365d': {
      totalInteractions: calcChange(1570, 1320),
      avgScore: calcChange(75, 55),
      positiveRate: calcChange(50, 42),
      engagementRate: calcChange(88, 80),
    },
    'all': {
      totalInteractions: calcChange(1570, 1320),
      avgScore: calcChange(75, 55),
      positiveRate: calcChange(50, 42),
      engagementRate: calcChange(88, 80),
    },
  };
  return statsByPeriod[period] || statsByPeriod['30d'];
};
