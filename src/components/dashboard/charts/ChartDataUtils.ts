export type PeriodFilter = '7d' | '30d' | '90d';

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return { current, previous, change, changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' };
};

export const getActivityData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Seg', emails: 2, reunioes: 1, ligacoes: 1, prevEmails: 1, prevReunioes: 1, prevLigacoes: 2 },
      { name: 'Ter', emails: 3, reunioes: 2, ligacoes: 1, prevEmails: 2, prevReunioes: 1, prevLigacoes: 1 },
      { name: 'Qua', emails: 4, reunioes: 1, ligacoes: 3, prevEmails: 3, prevReunioes: 2, prevLigacoes: 2 },
      { name: 'Qui', emails: 2, reunioes: 2, ligacoes: 1, prevEmails: 3, prevReunioes: 1, prevLigacoes: 1 },
      { name: 'Sex', emails: 5, reunioes: 2, ligacoes: 2, prevEmails: 4, prevReunioes: 2, prevLigacoes: 1 },
      { name: 'Sab', emails: 1, reunioes: 0, ligacoes: 1, prevEmails: 0, prevReunioes: 0, prevLigacoes: 0 },
      { name: 'Dom', emails: 0, reunioes: 0, ligacoes: 1, prevEmails: 1, prevReunioes: 0, prevLigacoes: 0 },
    ],
    '30d': [
      { name: 'Sem 1', emails: 12, reunioes: 8, ligacoes: 5, prevEmails: 10, prevReunioes: 6, prevLigacoes: 4 },
      { name: 'Sem 2', emails: 15, reunioes: 10, ligacoes: 7, prevEmails: 12, prevReunioes: 8, prevLigacoes: 5 },
      { name: 'Sem 3', emails: 14, reunioes: 6, ligacoes: 8, prevEmails: 11, prevReunioes: 7, prevLigacoes: 6 },
      { name: 'Sem 4', emails: 18, reunioes: 9, ligacoes: 8, prevEmails: 14, prevReunioes: 8, prevLigacoes: 7 },
    ],
    '90d': [
      { name: 'Out', emails: 42, reunioes: 25, ligacoes: 18, prevEmails: 38, prevReunioes: 22, prevLigacoes: 15 },
      { name: 'Nov', emails: 55, reunioes: 32, ligacoes: 25, prevEmails: 45, prevReunioes: 28, prevLigacoes: 20 },
      { name: 'Dez', emails: 48, reunioes: 28, ligacoes: 22, prevEmails: 50, prevReunioes: 30, prevLigacoes: 22 },
    ],
  };
  return dataByPeriod[period];
};

export const getActivityStats = (period: PeriodFilter) => {
  const s = { '7d': { emails: calcChange(17, 14), reunioes: calcChange(8, 7), ligacoes: calcChange(10, 7) }, '30d': { emails: calcChange(59, 47), reunioes: calcChange(33, 29), ligacoes: calcChange(28, 22) }, '90d': { emails: calcChange(145, 133), reunioes: calcChange(85, 80), ligacoes: calcChange(65, 57) } };
  return s[period];
};

export const getEvolutionData = (period: PeriodFilter) => {
  const d = {
    '7d': [{ period: 'Seg', score: 71, contatos: 68, prevScore: 68 }, { period: 'Ter', score: 72, contatos: 68, prevScore: 69 }, { period: 'Qua', score: 73, contatos: 69, prevScore: 70 }, { period: 'Qui', score: 72, contatos: 69, prevScore: 69 }, { period: 'Sex', score: 74, contatos: 70, prevScore: 70 }, { period: 'Sab', score: 74, contatos: 70, prevScore: 71 }, { period: 'Dom', score: 75, contatos: 70, prevScore: 71 }],
    '30d': [{ period: 'Sem 1', score: 68, contatos: 62, prevScore: 64 }, { period: 'Sem 2', score: 70, contatos: 65, prevScore: 66 }, { period: 'Sem 3', score: 72, contatos: 67, prevScore: 68 }, { period: 'Sem 4', score: 75, contatos: 70, prevScore: 70 }],
    '90d': [{ period: 'Out', score: 68, contatos: 55, prevScore: 62 }, { period: 'Nov', score: 72, contatos: 62, prevScore: 65 }, { period: 'Dez', score: 75, contatos: 70, prevScore: 68 }],
  };
  return d[period];
};

export const getEvolutionStats = (period: PeriodFilter) => {
  const s = { '7d': { score: calcChange(75, 71), contatos: calcChange(70, 68) }, '30d': { score: calcChange(75, 70), contatos: calcChange(70, 62) }, '90d': { score: calcChange(75, 68), contatos: calcChange(70, 55) } };
  return s[period];
};

export const getRelationshipData = (period: PeriodFilter) => {
  const d = {
    '7d': [{ name: 'Excelente', value: 8, prevValue: 7, color: 'hsl(var(--success))' }, { name: 'Bom', value: 15, prevValue: 14, color: 'hsl(var(--primary))' }, { name: 'Regular', value: 12, prevValue: 13, color: 'hsl(var(--warning))' }, { name: 'Fraco', value: 5, prevValue: 6, color: 'hsl(var(--destructive))' }],
    '30d': [{ name: 'Excelente', value: 10, prevValue: 8, color: 'hsl(var(--success))' }, { name: 'Bom', value: 18, prevValue: 15, color: 'hsl(var(--primary))' }, { name: 'Regular', value: 14, prevValue: 16, color: 'hsl(var(--warning))' }, { name: 'Fraco', value: 6, prevValue: 8, color: 'hsl(var(--destructive))' }],
    '90d': [{ name: 'Excelente', value: 12, prevValue: 9, color: 'hsl(var(--success))' }, { name: 'Bom', value: 22, prevValue: 18, color: 'hsl(var(--primary))' }, { name: 'Regular', value: 16, prevValue: 20, color: 'hsl(var(--warning))' }, { name: 'Fraco', value: 8, prevValue: 11, color: 'hsl(var(--destructive))' }],
  };
  return d[period];
};
export const getRelationshipStats = (period: PeriodFilter) => {
  const data = getRelationshipData(period);
  return {
    excellent: calcChange(data[0].value, data[0].prevValue),
    total: calcChange(data.reduce((s, i) => s + i.value, 0), data.reduce((s, i) => s + i.prevValue, 0))
  };
};
export const contactsByRole = [
  { name: 'Proprietário', value: 12, color: 'hsl(var(--secondary))' }, { name: 'Gerente', value: 18, color: 'hsl(var(--primary))' },
  { name: 'Comprador', value: 15, color: 'hsl(var(--success))' }, { name: 'Contato', value: 25, color: 'hsl(var(--muted-foreground))' },
];

export const getSentimentData = (period: PeriodFilter) => {
  const d = {
    '7d': [{ name: 'Positivo', value: 45, prevValue: 42, color: 'hsl(var(--success))' }, { name: 'Neutro', value: 35, prevValue: 38, color: 'hsl(var(--muted-foreground))' }, { name: 'Negativo', value: 8, prevValue: 10, color: 'hsl(var(--destructive))' }],
    '30d': [{ name: 'Positivo', value: 52, prevValue: 45, color: 'hsl(var(--success))' }, { name: 'Neutro', value: 42, prevValue: 45, color: 'hsl(var(--muted-foreground))' }, { name: 'Negativo', value: 12, prevValue: 16, color: 'hsl(var(--destructive))' }],
    '90d': [{ name: 'Positivo', value: 68, prevValue: 55, color: 'hsl(var(--success))' }, { name: 'Neutro', value: 55, prevValue: 60, color: 'hsl(var(--muted-foreground))' }, { name: 'Negativo', value: 18, prevValue: 25, color: 'hsl(var(--destructive))' }],
  };
  return d[period];
};

export const getSentimentStats = (period: PeriodFilter) => {
  const data = getSentimentData(period);
  return { positivo: calcChange(data[0].value, data[0].prevValue), negativo: calcChange(data[2].value, data[2].prevValue) };
};
