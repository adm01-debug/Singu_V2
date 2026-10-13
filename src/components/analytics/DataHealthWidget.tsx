import { Shield, AlertTriangle, CheckCircle, XCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataHealthView } from '@/hooks/useDataHealthView';
import { cn } from '@/lib/utils';

function toPercent(score: number | null): number | null {
  return score === null || !Number.isFinite(score) ? null : Math.round(Math.min(100, Math.max(0, score * 10)));
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

  if (error || !data?.length) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" /> Saúde dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            {error ? 'Erro ao carregar métricas de saúde' : 'Nenhuma métrica de saúde disponível'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const health = data[0];
  const overallScore = toPercent(health.health_score);
  const metrics = [
    { label: 'Empresas com proprietário', score: health.score_user_id_companies },
    { label: 'Contatos com proprietário', score: health.score_user_id_contacts },
    { label: 'Empresas com CNPJ', score: health.score_cnpj },
    { label: 'Histórico de interações', score: health.score_interactions },
    { label: 'Proteção por RLS', score: health.score_rls },
    { label: 'Tabelas essenciais', score: health.score_singu_tables },
    { label: 'Configurações iniciais', score: health.score_seeds },
    { label: 'Consultas do Singu', score: health.score_views },
    { label: 'Restrições de integridade', score: health.score_constraints },
  ];
  const counts = [
    { label: 'Tabelas', count: health.total_tables },
    { label: 'Consultas', count: health.total_views },
    { label: 'Interações da carteira', count: health.interactions_total },
  ];

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return Shield;
    if (score >= 80) return CheckCircle;
    if (score >= 50) return AlertTriangle;
    return XCircle;
  };

  const OverallIcon = getScoreIcon(overallScore);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Saúde dos Dados
        </CardTitle>
        <CardDescription>Indicadores agregados da carteira e da estrutura do CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
          <OverallIcon className={cn('h-10 w-10', getScoreColor(overallScore))} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Pontuação geral de saúde</p>
            <p className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
              {overallScore === null ? 'Sem pontuação' : `${overallScore}%`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Métricas agregadas
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {counts.map(({ label, count }) => (
            <div key={label}>
              <p className="font-semibold">{count === null ? '—' : count.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {metrics.map(metric => {
            const score = toPercent(metric.score);
            return (
              <div key={metric.label} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate font-medium text-foreground">
                  {metric.label}
                </span>
                <div className="w-24">
                  <Progress value={score ?? undefined} aria-label={metric.label} className="h-2" />
                </div>
                <span className={cn('w-10 text-right text-xs font-semibold', getScoreColor(score))}>
                  {score === null ? '—' : `${score}%`}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
