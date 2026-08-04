import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PeriodComparison } from './ChartDataUtils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-soft">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>{' '}{entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-soft">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">Quantidade: <span className="font-medium">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export const ComparisonBadge = ({ comparison, label }: { comparison: PeriodComparison; label: string }) => {
  const Icon = comparison.changeType === 'positive' ? TrendingUp : comparison.changeType === 'negative' ? TrendingDown : Minus;
  const colorClass = comparison.changeType === 'positive' ? 'text-success bg-success/10' : comparison.changeType === 'negative' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted';

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{comparison.change > 0 ? '+' : ''}{comparison.change}%</span>
      <span className="text-muted-foreground ml-1">{label}</span>
    </div>
  );
};
