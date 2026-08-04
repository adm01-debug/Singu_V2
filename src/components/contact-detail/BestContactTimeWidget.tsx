import { Clock, Phone, Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBestContactTime } from '@/hooks/useBestContactTime';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
};

export function BestContactTimeWidget({ contactId }: Props) {
  const { data, isLoading, error } = useBestContactTime(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-16" /></CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const dayName = data.day_of_week !== undefined ? DAYS_OF_WEEK[data.day_of_week] : null;
  const hour = data.hour_of_day !== undefined ? `${String(data.hour_of_day).padStart(2, '0')}:00` : null;
  const channel = data.suggested_channel;
  const ChannelIcon = channel ? (CHANNEL_ICONS[channel.toLowerCase()] || MessageCircle) : Clock;
  const successRate = data.success_rate !== undefined ? Math.round(data.success_rate * 100) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          Melhor Momento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <ChannelIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {dayName && <Badge variant="outline" className="text-xs">{dayName}</Badge>}
              {hour && <Badge variant="outline" className="text-xs tabular-nums">{hour}</Badge>}
              {channel && (
                <Badge variant="outline" className="text-xs border-info/40 text-info capitalize">
                  {channel}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {successRate !== null && (
                <span className={cn('font-medium',
                  successRate >= 70 ? 'text-success' : successRate >= 40 ? 'text-warning' : 'text-destructive'
                )}>
                  {successRate}% taxa de sucesso
                </span>
              )}
              {data.avg_response_time_minutes !== undefined && (
                <span>⏱️ ~{data.avg_response_time_minutes}min resposta</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
