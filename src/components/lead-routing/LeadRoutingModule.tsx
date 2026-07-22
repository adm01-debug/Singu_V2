import React, { useState, lazy, Suspense } from 'react';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Settings, ArrowRightLeft, BarChart3, MoreVertical, RefreshCw, RotateCcw, History, FileText } from 'lucide-react';
import { usePendingHandoffCount, useHandoffRealtime } from '@/hooks/useHandoffQueue';
import { useSalesTeam } from '@/hooks/useSalesTeam';
import { useServerRedistribute, useResetDailyCounts } from '@/hooks/useLeadRoutingServer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SalesTeamTab = lazy(() => import('./tabs/SalesTeamTab'));
const RoutingRulesTab = lazy(() => import('./tabs/RoutingRulesTab'));
const HandoffQueueTab = lazy(() => import('./tabs/HandoffQueueTab'));
const RoutingMetricsTab = lazy(() => import('./tabs/RoutingMetricsTab'));
const AssignmentHistoryTab = lazy(() => import('./tabs/AssignmentHistoryTab'));
const RedistributionLogTab = lazy(() => import('./tabs/RedistributionLogTab'));

const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 w-full" />
    ))}
  </div>
);

export default function LeadRoutingModule() {
  const [activeTab, setActiveTab] = useState('team');
  const { data: pendingCount = 0 } = usePendingHandoffCount();
  const { data: members = [] } = useSalesTeam();
  const redistribute = useServerRedistribute();
  const resetDaily = useResetDailyCounts();
  useHandoffRealtime();

  const activeSdrs = Array.isArray(members) ? members.filter((m) => m.role === 'sdr' && m.is_active).length : 0;
  const activeClosers = Array.isArray(members) ? members.filter((m) => m.role === 'closer' && m.is_active).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rodízio de Carteira</h1>
          <p className="text-sm text-muted-foreground">
            Distribuição inteligente de leads entre SDRs e Closers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeSdrs} SDR{activeSdrs !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {activeClosers} Closer{activeClosers !== 1 ? 's' : ''}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingCount} handoff{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais opções" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => redistribute.mutate({ inactivityDays: 7 })}
                disabled={redistribute.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Redistribuir Inativos (7d)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => resetDaily.mutate()}
                disabled={resetDaily.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar Contadores Diários
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="team" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Regras</span>
          </TabsTrigger>
          <TabsTrigger value="handoff" className="flex items-center gap-1.5 relative">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Handoff</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="redistlog" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
        </TabsList>

        <DashboardErrorBoundary sectionName="Lead Routing">
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
            <TabsContent value="history">
              <AssignmentHistoryTab />
            </TabsContent>
            <TabsContent value="redistlog">
              <RedistributionLogTab />
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
