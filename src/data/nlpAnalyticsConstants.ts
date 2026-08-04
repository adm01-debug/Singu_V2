import type { PeriodFilter } from '@/hooks/useNLPAnalyticsData';

export const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

export const emotionColors: Record<string, string> = {
  'Entusiasmo': 'hsl(142, 76%, 36%)',
  'Confiança': 'hsl(199, 89%, 48%)',
  'Interesse': 'hsl(262, 83%, 58%)',
  'Hesitação': 'hsl(38, 92%, 50%)',
  'Frustração': 'hsl(0, 84%, 60%)',
  'Ceticismo': 'hsl(215, 16%, 47%)',
  'Satisfação': 'hsl(142, 71%, 45%)',
  'Ansiedade': 'hsl(25, 95%, 53%)',
};

export const vakColors = {
  visual: 'hsl(199, 89%, 48%)',
  auditory: 'hsl(142, 76%, 36%)',
  kinesthetic: 'hsl(25, 95%, 53%)',
  digital: 'hsl(262, 83%, 58%)',
} as const;

export const discColors = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(38, 92%, 50%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(199, 89%, 48%)',
} as const;

export const CHART_COLORS = {
  positive: 'hsl(142, 76%, 36%)',
  neutral: 'hsl(215, 16%, 47%)',
  negative: 'hsl(0, 84%, 60%)',
  mixed: 'hsl(38, 92%, 50%)',
} as const;
