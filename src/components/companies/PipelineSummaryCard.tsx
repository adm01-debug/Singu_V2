import { usePipelineSummary } from '@/hooks/usePipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, UserCheck } from 'lucide-react';

export function PipelineSummaryCard() {
  const { data, isLoading } = usePipelineSummary();

  if (isLoading) return <Skeleton className="h-28 rounded-lg" />;
  if (!data) return null;

  const statuses = Object.entries(data.by_status ?? {}).sort((a, b) => b[1].count - a[1].count);
  const segments = Object.entries(data.by_segment ?? {}).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Base de empresas por status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold">{data.totals?.active ?? 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <UserCheck className="h-2.5 w-2.5" /> Ativas
            </p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold">{data.totals?.inactive ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Inativas</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold">{data.totals?.with_recent_interaction ?? 0}</p>
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-2.5 w-2.5" /> 30 dias
            </p>
          </div>
        </div>

        {statuses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {statuses.map(([status, info]) => (
              <Badge key={status} variant="outline" className="text-[10px]">
                {status}: {info.count}
                {info.recent > 0 && <span className="ml-1 text-success">+{info.recent}</span>}
              </Badge>
            ))}
          </div>
        )}

        {segments.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Top segmentos (ativas)</p>
            <div className="flex flex-wrap gap-1.5">
              {segments.map(([seg, count]) => (
                <Badge key={seg} variant="secondary" className="text-[10px]">
                  {seg}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}