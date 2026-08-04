import { Crown, Shield, Bell, Eye, UserCheck, TrendingUp, Minus, TrendingDown, UserX } from 'lucide-react';

export const QUADRANT_COLORS = {
  manage_closely: '#3b82f6',
  keep_satisfied: '#f59e0b',
  keep_informed: '#06b6d4',
  monitor: '#94a3b8',
};

export const SUPPORT_COLORS = {
  champion: '#22c55e',
  supporter: '#84cc16',
  neutral: '#94a3b8',
  skeptic: '#f97316',
  blocker: '#ef4444',
};

export function getSupportType(support: number): keyof typeof SUPPORT_COLORS {
  if (support >= 4) return 'champion';
  if (support >= 1) return 'supporter';
  if (support >= -1) return 'neutral';
  if (support >= -3) return 'skeptic';
  return 'blocker';
}

export function getSupportLabel(support: number): string {
  const type = getSupportType(support);
  const labels = { champion: 'Champion', supporter: 'Apoiador', neutral: 'Neutro', skeptic: 'Cético', blocker: 'Bloqueador' };
  return labels[type];
}

export function getQuadrantLabel(quadrant: string): string {
  const labels: Record<string, string> = { manage_closely: 'Gerenciar de Perto', keep_satisfied: 'Manter Satisfeito', keep_informed: 'Manter Informado', monitor: 'Monitorar' };
  return labels[quadrant] || quadrant;
}

export function getQuadrantIcon(quadrant: string) {
  const icons: Record<string, typeof Crown> = { manage_closely: Crown, keep_satisfied: Shield, keep_informed: Bell, monitor: Eye };
  return icons[quadrant] || Eye;
}

export function getSupportIcon(support: number) {
  const type = getSupportType(support);
  const icons = { champion: UserCheck, supporter: TrendingUp, neutral: Minus, skeptic: TrendingDown, blocker: UserX };
  return icons[type];
}

export interface NetworkNode {
  id: string;
  name: string;
  val: number;
  color: string;
  quadrant: string;
  power: number;
  interest: number;
  influence: number;
  support: number;
  engagement: number;
  riskLevel: string;
  avatar?: string;
  role?: string;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
  type: 'influence' | 'collaboration' | 'conflict';
  strength: number;
}
