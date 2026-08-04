import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmotionalTrend } from '@/hooks/useEmotionalTrend';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const TREND_ICON = { rising: TrendingUp, stable: Minus, declining: TrendingDown } as const;
const TREND_COLOR: Record<string, string> = { rising: 'text-success', stable: 'text-muted-foreground', declining: 'text-destructive' };

export const EmotionalTrendWidget = React.memo(function EmotionalTrendWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useEmotionalTrend(contactId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tendência Emocional</CardTitle></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>;
  if (!data) return null;

  const trendKey = (data.trend_direction?.toLowerCase() || 'stable') as keyof typeof TREND_ICON;
  const TrendIcon = TREND_ICON[trendKey] || Minus;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" />Tendência Emocional</span>
          <div className="flex items-center gap-1">
            <TrendIcon className={cn("h-3.5 w-3.5", TREND_COLOR[trendKey] || TREND_COLOR.stable)} />
            {data.trend_status && <Badge variant="outline" className="text-[10px]">{data.trend_status}</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-success/10 p-2"><p className="text-sm font-bold text-success">{data.positive_interactions || 0}</p><p className="text-[9px] text-muted-foreground">Positivas</p></div>
          <div className="rounded-lg bg-muted p-2"><p className="text-sm font-bold text-muted-foreground">{data.neutral_interactions || 0}</p><p className="text-[9px] text-muted-foreground">Neutras</p></div>
          <div className="rounded-lg bg-destructive/10 p-2"><p className="text-sm font-bold text-destructive">{data.negative_interactions || 0}</p><p className="text-[9px] text-muted-foreground">Negativas</p></div>
        </div>
        {data.dominant_emotion && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Emoção Dominante</span>
            <Badge variant="secondary" className="text-[10px] capitalize">{data.dominant_emotion}</Badge>
          </div>
        )}
        {data.triggers_positive && data.triggers_positive.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Gatilhos Positivos</p>
            <div className="flex flex-wrap gap-1">{data.triggers_positive.slice(0, 4).map((t, i) => <Badge key={i} variant="outline" className="text-[9px] border-success/30 text-success">{t}</Badge>)}</div>
          </div>
        )}
        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Ações</p>
            <ul className="space-y-0.5">{data.recommended_actions.slice(0, 2).map((a, i) => <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1"><span className="text-primary mt-0.5">•</span>{a}</li>)}</ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default EmotionalTrendWidget;
