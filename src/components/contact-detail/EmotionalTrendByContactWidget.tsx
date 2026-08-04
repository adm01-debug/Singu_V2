import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmotionalTrendByContact } from '@/hooks/useEmotionalTrendView';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const TREND_MAP: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  rising: { Icon: TrendingUp, color: 'text-success', label: 'Em alta' },
  stable: { Icon: Minus, color: 'text-muted-foreground', label: 'Estável' },
  declining: { Icon: TrendingDown, color: 'text-destructive', label: 'Em baixa' },
};

export const EmotionalTrendByContactWidget = React.memo(function EmotionalTrendByContactWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useEmotionalTrendByContact(contactId);

  if (isLoading) return <Card><CardContent className="py-3"><Skeleton className="h-8" /></CardContent></Card>;
  if (!data) return null;

  const trendKey = String(data.trend_direction || '').toLowerCase();
  const trend = TREND_MAP[trendKey] || TREND_MAP.stable;
  const { Icon, color, label } = trend;

  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", trendKey === 'rising' ? "bg-success/10" : trendKey === 'declining' ? "bg-destructive/10" : "bg-muted/30")}>
          <Heart className={cn("h-4 w-4", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Tendência Emocional</p>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-semibold", color)}>{data.dominant_emotion || label}</span>
            <Icon className={cn("h-3.5 w-3.5", color)} />
            <Badge variant="outline" className={cn("text-[9px]", color)}>{label}</Badge>
          </div>
        </div>
        {data.confidence != null && (
          <span className="text-lg font-bold tabular-nums">{Math.round(data.confidence * 100)}%</span>
        )}
      </CardContent>
    </Card>
  );
});

export default EmotionalTrendByContactWidget;
