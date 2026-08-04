import { Shield, AlertTriangle, CheckCircle, XCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataHealthView } from '@/hooks/useDataHealthView';
import { cn } from '@/lib/utils';

interface HealthRecord {
  table_name?: string;
  completeness_pct?: number;
  total_records?: number;
  missing_fields?: number;
  quality_score?: number;
  status?: string;
  [key: string]: unknown;
}

export function DataHealthWidget() {
  const { data, isLoading, error } = useDataHealthView();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" /> Saúde dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar métricas de saúde</p>
        </CardContent>
      </Card>
    );
  }

  const records = (data as HealthRecord[]) || [];

  // Compute overall health score
  const avgScore = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.quality_score ?? r.completeness_pct ?? 0), 0) / records.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 50) return AlertTriangle;
    return XCircle;
  };

  const OverallIcon = getScoreIcon(avgScore);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Saúde dos Dados
        </CardTitle>
        <CardDescription>Completude e qualidade das tabelas do CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall score */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
          <OverallIcon className={cn('h-10 w-10', getScoreColor(avgScore))} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Score Geral de Saúde</p>
            <p className={cn('text-3xl font-bold', getScoreColor(avgScore))}>{avgScore}%</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {records.length} tabelas
          </Badge>
        </div>

        {/* Per-table breakdown */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {records.slice(0, 15).map((r, i) => {
            const score = r.quality_score ?? r.completeness_pct ?? 0;
            return (
              <div key={r.table_name || i} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate font-medium text-foreground">
                  {r.table_name || `Tabela ${i + 1}`}
                </span>
                <div className="w-24">
                  <Progress value={score} className="h-2" />
                </div>
                <span className={cn('w-10 text-right text-xs font-semibold', getScoreColor(score))}>
                  {Math.round(score)}%
                </span>
                {r.total_records != null && (
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {Number(r.total_records).toLocaleString('pt-BR')} reg
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
