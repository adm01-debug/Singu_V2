import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useActivityHeatmap } from '@/hooks/useInteractionsRpc';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-muted/30';
  const ratio = count / max;
  if (ratio > 0.75) return 'bg-primary';
  if (ratio > 0.5) return 'bg-primary/70';
  if (ratio > 0.25) return 'bg-primary/40';
  return 'bg-primary/20';
}

export const ActivityHeatmapChart = React.memo(function ActivityHeatmapChart({ days = 30 }: { days?: number }) {
  const { data: heatmapData, isLoading, error } = useActivityHeatmap(days);

  if (error) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Heatmap de Atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!heatmapData || !Array.isArray(heatmapData) || heatmapData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Dados insuficientes para gerar o heatmap.</p>
        </CardContent>
      </Card>
    );
  }

  // Build 7x24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCount = 1;
  heatmapData.forEach(({ day_of_week, hour, count }) => {
    if (day_of_week >= 0 && day_of_week < 7 && hour >= 0 && hour < 24) {
      grid[day_of_week][hour] = count;
      if (count > maxCount) maxCount = count;
    }
  });

  // Show only hours 6-22 for cleaner display
  const visibleHours = HOURS.filter(h => h >= 6 && h <= 22);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Heatmap de Atividade
          <Badge variant="outline" className="text-[10px] ml-auto">{days}d</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Concentração de interações por dia e hora</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Hour labels */}
            <div className="flex mb-1 ml-10">
              {visibleHours.map(h => (
                <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                  {h}h
                </div>
              ))}
            </div>

            {/* Grid */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{day}</span>
                <div className="flex flex-1 gap-0.5">
                  {visibleHours.map(hour => (
                    <div
                      key={hour}
                      className={cn(
                        'flex-1 aspect-square rounded-sm transition-colors',
                        intensityClass(grid[dayIdx][hour], maxCount)
                      )}
                      title={`${day} ${hour}h: ${grid[dayIdx][hour]} interações`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[9px] text-muted-foreground">Menos</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/70" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
              </div>
              <span className="text-[9px] text-muted-foreground">Mais</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ActivityHeatmapChart;
