import { Brain, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscDashboardView } from '@/hooks/useDiscDashboardView';
import { cn } from '@/lib/utils';

interface DiscRecord {
  profile_type?: string;
  contact_count?: number;
  avg_score?: number;
  conversion_rate?: number;
  avg_deal_size?: number;
  color?: string;
  [key: string]: unknown;
}

const DISC_COLORS: Record<string, string> = {
  D: 'bg-red-500',
  I: 'bg-yellow-500',
  S: 'bg-green-500',
  C: 'bg-blue-500',
};

const DISC_LABELS: Record<string, string> = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
};

export function DiscDashboardWidget() {
  const { data, isLoading, error } = useDiscDashboardView();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" /> Dashboard DISC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar dados DISC</p>
        </CardContent>
      </Card>
    );
  }

  const records = (data as DiscRecord[]) || [];
  const totalContacts = records.reduce((sum, r) => sum + (r.contact_count ?? 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          Dashboard DISC
        </CardTitle>
        <CardDescription>Distribuição de perfis comportamentais na base</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total header */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total de contatos perfilados</span>
          </div>
          <span className="text-lg font-bold text-foreground">{totalContacts.toLocaleString('pt-BR')}</span>
        </div>

        {/* Profile breakdown */}
        <div className="space-y-3">
          {records.map((r, i) => {
            const profile = r.profile_type?.charAt(0)?.toUpperCase() || '?';
            const count = r.contact_count ?? 0;
            const pct = totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0;
            const colorClass = DISC_COLORS[profile] || 'bg-muted';

            return (
              <div key={r.profile_type || i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', colorClass)} />
                    <span className="text-sm font-medium text-foreground">
                      {DISC_LABELS[profile] || r.profile_type || profile}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{count}</Badge>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <Progress value={pct} className="h-2" />
                {(r.conversion_rate != null || r.avg_deal_size != null) && (
                  <div className="flex gap-4 text-xs text-muted-foreground pl-5">
                    {r.conversion_rate != null && (
                      <span>Conversão: <strong className="text-foreground">{Number(r.conversion_rate).toFixed(1)}%</strong></span>
                    )}
                    {r.avg_deal_size != null && (
                      <span>Ticket médio: <strong className="text-foreground">R$ {Number(r.avg_deal_size).toLocaleString('pt-BR')}</strong></span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
