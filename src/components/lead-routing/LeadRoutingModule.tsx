import React, { useState, lazy, Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Layers, ShieldAlert, BarChart3 } from 'lucide-react';
import { useRodizioEquipe, useRodizioConfigFlags } from '@/hooks/useRodizioEquipe';
import { useRodizioBloqueios } from '@/hooks/useRodizioBloqueios';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SalesTeamTab = lazy(() => import('./tabs/SalesTeamTab'));
const RoutingRulesTab = lazy(() => import('./tabs/RoutingRulesTab')); // conteúdo: Ondas
const HandoffQueueTab = lazy(() => import('./tabs/HandoffQueueTab')); // conteúdo: Bloqueios
const RoutingMetricsTab = lazy(() => import('./tabs/RoutingMetricsTab'));

const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-full" />
    ))}
  </div>
);

export default function LeadRoutingModule() {
  const [activeTab, setActiveTab] = useState('team');
  const { data: equipe } = useRodizioEquipe();
  const { data: flags } = useRodizioConfigFlags();
  const { data: bloqueios = [] } = useRodizioBloqueios();

  const activeSdrs = equipe?.sdrs.filter((s) => s.is_active).length ?? 0;
  const activeClosers = equipe?.closers.filter((c) => c.is_active).length ?? 0;
  const pendingBloqueios = bloqueios.filter((b) => b.status === 'PENDENTE_APROVACAO').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rodízio de Carteira</h1>
          <p className="text-sm text-muted-foreground">
            Distribuição de carteira entre SDRs e Closers por ondas, com bloqueios e aprovação
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {activeSdrs} SDR{activeSdrs !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {activeClosers} Closer{activeClosers !== 1 ? 's' : ''}
          </Badge>
          {pendingBloqueios > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingBloqueios} bloqueio{pendingBloqueios !== 1 ? 's' : ''} pendente{pendingBloqueios !== 1 ? 's' : ''}
            </Badge>
          )}
          {flags && (
            <Badge variant="secondary" className="text-xs" title="Kill switches em config_regras_negocio">
              Rodízio {flags.closerAtivo || flags.sdrAtivo ? 'ativo' : 'desligado'}
            </Badge>
          )}
        </div>
      </div>

      {/*
        Decisão sobre o menu de ações do header: as ações antigas
        "Redistribuir Inativos" e "Resetar Contadores Diários" chamavam a
        Edge Function `lead-routing`, removida. Não há equivalente 1:1 no
        motor novo — a operação mais próxima seria rodar
        `rodizio_closer_executar`/`rodizio_sdr_executar` em modo REAL, mas
        isso é uma ação administrativa de maior impacto (rotaciona a
        carteira de verdade) e não deveria estar a um clique num dropdown do
        header sem contexto de qual onda/filtro está sendo aplicado. Por
        isso o dropdown foi removido: a simulação (DRY_RUN) rápida ficou no
        widget da aba Equipe, e a aplicação real fica na aba Ondas, com
        contexto de onda, staging e confirmação explícita.
      */}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="team" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Ondas</span>
          </TabsTrigger>
          <TabsTrigger value="handoff" className="flex items-center gap-1.5 relative">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Bloqueios</span>
            {pendingBloqueios > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                {pendingBloqueios}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
        </TabsList>

        <DashboardErrorBoundary sectionName="Rodízio de Carteira">
          <Suspense fallback={<TabSkeleton />}>
            <TabsContent value="team">
              <SalesTeamTab />
            </TabsContent>
            <TabsContent value="rules">
              <RoutingRulesTab />
            </TabsContent>
            <TabsContent value="handoff">
              <HandoffQueueTab />
            </TabsContent>
            <TabsContent value="metrics">
              <RoutingMetricsTab />
            </TabsContent>
          </Suspense>
        </DashboardErrorBoundary>
      </Tabs>
    </div>
  );
}
