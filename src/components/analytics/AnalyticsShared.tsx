import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PeriodComparison } from '@/data/analyticsData';

// Tooltip payload types for Recharts
interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export const CustomTooltip = forwardRef<HTMLDivElement, CustomTooltipProps>(
  function CustomTooltip({ active, payload, label }, ref) {
    if (active && payload && payload.length) {
      return (
        <div ref={ref} className="bg-card border border-border rounded-lg p-3 shadow-soft">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              <span style={{ color: entry.color }} className="font-medium">
                {entry.name}:
              </span>{' '}
              {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }
);

export const PieTooltip = forwardRef<HTMLDivElement, CustomTooltipProps>(
  function PieTooltip({ active, payload }, ref) {
    if (active && payload && payload.length) {
      return (
        <div ref={ref} className="bg-card border border-border rounded-lg p-3 shadow-soft">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Quantidade: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  }
);

export const ComparisonBadge = ({ comparison, suffix = '' }: { comparison: PeriodComparison; suffix?: string }) => {
  const Icon = comparison.changeType === 'positive' ? TrendingUp : 
               comparison.changeType === 'negative' ? TrendingDown : Minus;
  const colorClass = comparison.changeType === 'positive' ? 'text-success bg-success/10' : 
                     comparison.changeType === 'negative' ? 'text-destructive bg-destructive/10' : 
                     'text-muted-foreground bg-muted';
  
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      <Icon className="w-3 h-3" />
      {comparison.change > 0 ? '+' : ''}{comparison.change}%{suffix && ` ${suffix}`}
    </span>
  );
};

export const StatCard = ({ 
  title, 
  value, 
  comparison, 
  icon: Icon, 
  iconColor 
}: { 
  title: string; 
  value: string | number; 
  comparison: PeriodComparison; 
  icon: React.ElementType; 
  iconColor: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-3 rounded-xl", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <ComparisonBadge comparison={comparison} />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
