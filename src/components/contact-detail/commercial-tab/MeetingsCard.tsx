import { useContactMeetings } from '@/hooks/useContactMeetings';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, Video } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

export function MeetingsCard({ contactId }: Props) {
  const { data: meetings, isLoading, error, refetch } = useContactMeetings(contactId);

  return (
    <ExternalDataCard title="Reuniões" icon={<CalendarDays className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!meetings?.length} emptyMessage="Nenhuma reunião registrada">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Reuniões</span>
            <Badge variant="outline" className="text-[10px]">{meetings?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {meetings?.map(m => (
              <div key={m.id} className="p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate flex-1">{m.title}</p>
                  {m.status && <Badge variant="outline" className="text-[9px] ml-2">{m.status}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {m.scheduled_at && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><CalendarDays className="h-2.5 w-2.5" />{format(new Date(m.scheduled_at), 'dd/MM/yy HH:mm')}</span>}
                  {m.duration_minutes != null && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{m.duration_minutes}min</span>}
                  {m.location && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{m.location}</span>}
                  {m.meeting_url && <a href={m.meeting_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"><Video className="h-2.5 w-2.5" />Link</a>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
