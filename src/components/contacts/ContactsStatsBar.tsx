import { useMemo } from 'react';
import { Users, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/hooks/useContacts';

interface ContactsStatsBarProps {
  contacts: Contact[];
  className?: string;
}

export function ContactsStatsBar({ contacts, className }: ContactsStatsBarProps) {
  const stats = useMemo(() => {
    const total = contacts.length;
    const avgScore = total > 0
      ? Math.round(contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / total)
      : 0;
    const excellent = contacts.filter(c => (c.relationship_score || 0) >= 80).length;
    const atRisk = contacts.filter(c => c.relationship_stage === 'at_risk').length;
    const inactive = contacts.filter(c => {
       // Logic for inactive: relationship_score low and no recent update
       return (c.relationship_score || 0) < 40;
    }).length;

    return { total, avgScore, excellent, atRisk, inactive };
  }, [contacts]);


  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 50) return 'text-primary';
    if (score >= 30) return 'text-warning';
    return 'text-destructive';
  };

  const items = [
    {
      icon: Users,
      label: 'Total',
      value: stats.total,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: TrendingUp,
      label: 'Score médio',
      value: stats.avgScore,
      suffix: '/100',
      color: getScoreColor(stats.avgScore),
      bgColor: stats.avgScore >= 70 ? 'bg-success/10' : stats.avgScore >= 50 ? 'bg-primary/10' : 'bg-warning/10',
    },
    {
      icon: Star,
      label: 'Excelentes',
      value: stats.excellent,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: AlertTriangle,
      label: 'Em Risco',
      value: stats.atRisk,
      color: stats.atRisk > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: stats.atRisk > 0 ? 'bg-destructive/10' : 'bg-muted/50',
    },

  ];

  return (
    <div className={cn(
      'grid grid-cols-2 sm:grid-cols-4 gap-2',
      className
    )}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center gap-2.5 rounded-lg border border-border/30 px-3 py-2.5',
            'bg-card/40 transition-colors duration-150',
            'hover:bg-muted/30'
          )}
        >
          <item.icon className={cn('w-4 h-4 shrink-0', item.color)} />
          <div className="min-w-0">
            <p className={cn('text-base font-semibold tabular-nums leading-tight', item.color)}>
              {item.value}
              {item.suffix && <span className="text-xs text-muted-foreground font-normal">{item.suffix}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground/70 truncate">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
