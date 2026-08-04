import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone } from 'lucide-react';

interface TouchpointData {
  total_touchpoints: number;
  avg_gap_days: number | null;
  last_touchpoint: string | null;
  by_channel?: Record<string, number>;
}

export function TouchpointSummaryCard({ touchpoints }: { touchpoints: TouchpointData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Resumo de Touchpoints
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{touchpoints.total_touchpoints}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold">{touchpoints.avg_gap_days?.toFixed(0) || 0}d</div>
            <div className="text-[10px] text-muted-foreground">Gap Médio</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-sm font-medium">{touchpoints.last_touchpoint ? new Date(touchpoints.last_touchpoint).toLocaleDateString('pt-BR') : '—'}</div>
            <div className="text-[10px] text-muted-foreground">Último</div>
          </div>
        </div>
        {touchpoints.by_channel && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(touchpoints.by_channel).map(([channel, count]) => (
              <Badge key={channel} variant="outline" className="text-[10px]">
                {channel}: {count as number}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
