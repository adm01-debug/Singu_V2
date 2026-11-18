import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany360 } from '@/hooks/useCompanyIntelligence';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Indicadores da conta.
 *
 * Este card era um radar de "Benchmark do Setor" com cinco eixos, dos quais
 * três não vinham de dado nenhum: a série inteira da "Média Setor"
 * (65, 40, 60, 80, 70) era literal no código, assim como "Receita: 70" e
 * "Fidelidade: 85" da própria empresa. "Engajamento" era
 * `total_contacts * 10`, que estoura 100% com dez contatos.
 *
 * Não existe fonte de dados de setor no sistema. De `get_company_360_view`
 * só saem medidas reais `health_score` e `churn_risk`, então é isso que o
 * card mostra — sem comparação inventada.
 */

interface Indicador {
  rotulo: string;
  valor: number;
  descricao: string;
}

function corDaFaixa(valor: number) {
  if (valor >= 70) return 'bg-success';
  if (valor >= 40) return 'bg-warning';
  return 'bg-destructive';
}

export default function CompanyBenchmarkRadar({ companyId }: { companyId: string }) {
  const { data: company360, isLoading } = useCompany360(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Indicadores da Conta</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-24" /></CardContent>
      </Card>
    );
  }
  if (!company360) return null;

  const indicadores: Indicador[] = [];
  if (company360.health_score != null) {
    indicadores.push({
      rotulo: 'Saúde da conta',
      valor: Math.max(0, Math.min(100, company360.health_score)),
      descricao: 'calculado por calculate_company_health_score',
    });
  }
  if (company360.churn_risk != null) {
    indicadores.push({
      rotulo: 'Retenção',
      valor: Math.max(0, Math.min(100, 100 - company360.churn_risk)),
      descricao: 'inverso do risco de churn',
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Indicadores da Conta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {indicadores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Ainda não há indicadores calculados para esta empresa.
          </p>
        ) : (
          indicadores.map((i) => (
            <div key={i.rotulo} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">{i.rotulo}</span>
                <span className="text-sm font-semibold">{i.valor}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={cn('h-full transition-all duration-500', corDaFaixa(i.valor))} style={{ width: `${i.valor}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{i.descricao}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
