import React from 'react';
import { Building2, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardStatsGridProps {
  stats: DashboardStats;
  prefersReducedMotion: boolean;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Meta: 80% · ✨ Excelente';
  if (score >= 60) return 'Meta: 80% · Bom progresso';
  if (score >= 40) return 'Meta: 80% · Em evolução';
  return 'Meta: 80% · Precisa melhorar';
}

function getInteractionLabel(count: number): string {
  if (count === 0) return 'Nenhuma interação esta semana';
  if (count < 5) return 'Comece a engajar mais!';
  if (count < 15) return 'Bom ritmo de engajamento';
  return 'Engajamento intenso 🔥';
}

export const DashboardStatsGrid = React.memo(function DashboardStatsGrid({ stats, prefersReducedMotion }: DashboardStatsGridProps) {
  const companyChangeType = stats.companyChange?.startsWith('+') && stats.companyChange !== '+0' ? 'positive' as const : 'neutral' as const;
  const interactionChangeType = stats.weeklyInteractions > 0 ? 'positive' as const : 'neutral' as const;
  const scoreChangeType = stats.averageScore > 50 ? 'positive' as const : stats.averageScore > 25 ? 'neutral' as const : 'negative' as const;

  const cards = [
    {
      title: 'Total de Empresas',
      value: stats.totalCompanies,
      change: stats.companyChange,
      changeType: companyChangeType,
      icon: Building2,
      gradientTone: 'primary' as const,
    },
    {
      title: 'Score Médio',
      value: `${stats.averageScore}%`,
      change: stats.scoreChange,
      changeType: scoreChangeType,
      icon: TrendingUp,
      gradientTone: 'warning' as const,
      subtitle: getScoreLabel(stats.averageScore),
    },
    {
      title: 'Interações (7 dias)',
      value: stats.weeklyInteractions,
      change: stats.interactionChange,
      changeType: interactionChangeType,
      icon: MessageSquare,
      gradientTone: 'premium' as const,
      sparkline: stats.interactionSparkline,
      emptyAction: stats.weeklyInteractions === 0 ? { label: 'Registrar interação', href: '/interacoes' } : undefined,
      subtitle: getInteractionLabel(stats.weeklyInteractions),
    },
    {
      title: 'Closing Score (Avg)',
      value: `${stats.averageClosingScore}%`,
      change: '+2% vs ontem',
      changeType: 'positive' as const,
      icon: Users,
      gradientTone: 'success' as const,
      subtitle: 'Probabilidade de fechamento',
    },
  ];


  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((stat, index) => (
        <StatCard
          key={stat.title}
          {...stat}
          delay={prefersReducedMotion ? 0 : index}
          variant={index === 0 ? 'elevated' : 'default'}
        />
      ))}
    </div>
  );
});
