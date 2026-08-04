import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunicationIntelList } from '@/hooks/useCommunicationIntelView';
import { useEmotionalTrendList } from '@/hooks/useEmotionalTrendView';
import { useRapportIntelList } from '@/hooks/useRapportIntelView';
import { Radio, Heart, Handshake, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TREND_ICON = { rising: TrendingUp, stable: Minus, declining: TrendingDown } as const;
const TREND_COLOR: Record<string, string> = { rising: 'text-success', stable: 'text-muted-foreground', declining: 'text-destructive' };

export const BehavioralIntelSummaryWidget = React.memo(function BehavioralIntelSummaryWidget() {
  const { data: commIntel, isLoading: commLoading } = useCommunicationIntelList();
  const { data: emotionalList, isLoading: emoLoading } = useEmotionalTrendList();
  const { data: rapportList, isLoading: rapLoading } = useRapportIntelList();

  const loading = commLoading || emoLoading || rapLoading;

  if (loading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Intel Comportamental</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;

  const totalComm = commIntel?.length || 0;
  const totalEmotional = emotionalList?.length || 0;
  const totalRapport = rapportList?.length || 0;

  // Summary stats
  const avgSuccessRate = totalComm > 0
    ? (commIntel!.reduce((acc, c) => acc + (Number((c as Record<string, unknown>).success_rate) || 0), 0) / totalComm * 100).toFixed(0)
    : '-';

  const positiveEmotions = emotionalList?.filter(e => {
    const trend = String((e as Record<string, unknown>).trend_direction || '').toLowerCase();
    return trend === 'rising';
  }).length || 0;

  if (totalComm === 0 && totalEmotional === 0 && totalRapport === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">🧠 Resumo Intel Comportamental</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-primary/5 p-3 text-center">
            <Radio className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalComm}</p>
            <p className="text-[9px] text-muted-foreground">Contatos Mapeados</p>
            <p className="text-[9px] text-primary font-medium">{avgSuccessRate}% taxa sucesso</p>
          </div>
          <div className="rounded-lg bg-warning/5 p-3 text-center">
            <Heart className="h-4 w-4 mx-auto mb-1 text-warning" />
            <p className="text-lg font-bold">{totalEmotional}</p>
            <p className="text-[9px] text-muted-foreground">Tendências Emocionais</p>
            <p className="text-[9px] text-success font-medium">{positiveEmotions} em alta</p>
          </div>
          <div className="rounded-lg bg-success/5 p-3 text-center">
            <Handshake className="h-4 w-4 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{totalRapport}</p>
            <p className="text-[9px] text-muted-foreground">Perfis Rapport</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default BehavioralIntelSummaryWidget;
