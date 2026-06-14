import { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAY_LABELS } from './helpers';

interface TimeData {
  day_of_week: number;
  hour_of_day: number;
  success_count: number | null;
  total_attempts: number | null;
  avg_response_time_minutes: number | null;
}

interface Props {
  data: TimeData[];
}

export const TimeHeatmapCard = memo(function TimeHeatmapCard({ data }: Props) {
  if (data.length === 0) return null;

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const dataMap = new Map<string, { rate: number; attempts: number; avgResp: number | null }>();
  let maxAttempts = 1;

  data.forEach((d) => {
    const attempts = d.total_attempts || 0;
    const success = d.success_count || 0;
    if (attempts > 0) {
      dataMap.set(`${d.day_of_week}-${d.hour_of_day}`, {
        rate: Math.round((success / attempts) * 100),
        attempts,
        avgResp: d.avg_response_time_minutes,
      });
      if (attempts > maxAttempts) maxAttempts = attempts;
    }
  });

  const getColor = (rate: number, attempts: number) => {
    const opacity = Math.min(0.3 + (attempts / maxAttempts) * 0.7, 1);
    if (rate >= 70) return `rgba(34, 197, 94, ${opacity})`;
    if (rate >= 40) return `rgba(234, 179, 8, ${opacity})`;
    if (rate > 0) return `rgba(239, 68, 68, ${opacity})`;
    return 'transparent';
  };

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-success" />
          Mapa de Engajamento — Melhores Horários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex gap-0.5 mb-1">
              <div className="w-8 flex-shrink-0" />
              {hours.map((h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">{h}h</div>
              ))}
            </div>
            {DAY_LABELS.map((day, dayIdx) => (
              <div key={dayIdx} className="flex gap-0.5 mb-0.5">
                <div className="w-8 flex-shrink-0 text-[10px] text-muted-foreground flex items-center">{day}</div>
                {hours.map((hour) => {
                  const cell = dataMap.get(`${dayIdx}-${hour}`);
                  const respSuffix = cell?.avgResp != null ? ` · ${cell.avgResp}min resp.` : '';
                  const cellTitle = cell
                    ? `${day} ${hour}h: ${cell.rate}% sucesso (${cell.attempts} tentativas)${respSuffix}`
                    : `${day} ${hour}h: sem dados`;
                  return (
                    <div
                      key={hour}
                      className="flex-1 aspect-square rounded-sm border border-border/50 relative group cursor-default"
                      style={{ backgroundColor: cell ? getColor(cell.rate, cell.attempts) : undefined }}
                      title={cellTitle}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-3 mt-2 justify-center">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.7)' }} />
                <span className="text-[10px] text-muted-foreground">≥70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(234, 179, 8, 0.7)' }} />
                <span className="text-[10px] text-muted-foreground">40-69%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
                <span className="text-[10px] text-muted-foreground">&lt;40%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
