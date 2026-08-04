import { Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContactTimeAnalysis } from '@/hooks/useContactTimeAnalysis';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

export function BestTimeToContactCard({ contactId }: Props) {
  const { bestTimes, heatmapData, loading } = useContactTimeAnalysis(contactId);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          Melhor Horário de Contato
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bestTimes.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {bestTimes.map((slot, idx) => (
                <div key={`${slot.dayOfWeek}-${slot.hourOfDay}`} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                    <span className="font-medium text-foreground">{slot.dayLabel} às {slot.hourLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{slot.totalAttempts} tentativas</Badge>
                    <span className={cn('text-xs font-medium',
                      slot.successRate >= 70 ? 'text-success' :
                      slot.successRate >= 40 ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {Math.round(slot.successRate)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini heatmap */}
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground mb-1">Mapa de calor (6h-22h)</p>
              {heatmapData.map(row => (
                <div key={row.day} className="flex items-center gap-0.5">
                  <span className="text-[9px] text-muted-foreground w-6">{row.day}</span>
                  {row.hours.slice(6, 22).map(cell => (
                    <div
                      key={cell.hour}
                      className={cn('h-3 w-3 rounded-[2px]',
                        cell.attempts === 0 ? 'bg-muted' :
                        cell.successRate >= 70 ? 'bg-success' :
                        cell.successRate >= 40 ? 'bg-warning' :
                        cell.successRate > 0 ? 'bg-destructive/50' : 'bg-muted'
                      )}
                      title={`${row.day} ${cell.hour}h: ${Math.round(cell.successRate)}% (${cell.attempts} tentativas)`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sem dados de horário suficientes</p>
        )}
      </CardContent>
    </Card>
  );
}
