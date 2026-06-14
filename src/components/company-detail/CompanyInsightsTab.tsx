import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { useCompanyTimeline, useCompany360, useNextBestAction, useTouchpointSummary, useKeyContacts, useChurnRisk } from '@/hooks/useCompanyIntelligence';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, Clock, Brain, AlertTriangle, Lightbulb, Phone } from 'lucide-react';
import { Company360Card } from './insights/Company360Card';
import { CompanyTimelineCard } from './insights/CompanyTimelineCard';
import type { Tables } from '@/integrations/supabase/types';
import type { DISCProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const CompanyHealthScoreWidget = lazy(() => import('./CompanyHealthScoreWidget'));
const CompanyStatisticsWidget = lazy(() => import('./CompanyStatisticsWidget'));
const AccountPlanWidget = lazy(() => import('./AccountPlanWidget'));
const PropensityScoreWidget = lazy(() => import('./PropensityScoreWidget'));
const CompanyDuplicatesWidget = lazy(() => import('./CompanyDuplicatesWidget'));
const OptimalContactWindowsWidget = lazy(() => import('./OptimalContactWindowsWidget'));
const QuickActionsWidget = lazy(() => import('./QuickActionsWidget'));
const CompanyViewsWidget = lazy(() => import('./CompanyViewsWidget'));
const InteractionHistoryWidget = lazy(() => import('./InteractionHistoryWidget'));
const CompanyBenchmarkRadar = lazy(() => import('./CompanyBenchmarkRadar'));
const CreateDealWidget = lazy(() => import('@/components/pipeline/CreateDealWidget'));

type Contact = Tables<'contacts'>;

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

interface CompanyInsightsTabProps {
  companyId: string;
  contacts: Contact[];
  avgRelationshipScore: number;
  totalInteractions: number;
  positiveInteractions: number;
  pendingFollowUps: number;
}


export function CompanyInsightsTab({ 
  companyId, contacts, avgRelationshipScore, 
  totalInteractions, positiveInteractions, pendingFollowUps 
}: CompanyInsightsTabProps) {
  const { data: timeline = [], isLoading: timelineLoading, error: timelineError, refetch: refetchTimeline } = useCompanyTimeline(companyId);
  const { data: company360, isLoading: c360Loading, error: c360Error, refetch: refetch360 } = useCompany360(companyId);
  const { data: nextAction } = useNextBestAction(companyId);
  const { data: touchpoints } = useTouchpointSummary(companyId);
  const { data: churnRisk } = useChurnRisk(companyId);
  const { data: keyContacts = [] } = useKeyContacts(companyId);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AccountChurnPredictionPanel companyId={companyId} />

      {/* Next Best Action */}
      {nextAction && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Próxima Ação Recomendada</span>
                  <Badge variant="outline" className="text-[10px]">{nextAction.priority}</Badge>
                </div>
                <p className="text-sm text-foreground/80">{nextAction.description}</p>
                {nextAction.reason && (
                  <p className="text-xs text-muted-foreground mt-1">💡 {nextAction.reason}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn Risk inline */}
      {churnRisk && (
        <Card className={`border-l-4 ${churnRisk === 'alto' || churnRisk === 'crítico' ? 'border-l-destructive' : churnRisk === 'médio' ? 'border-l-warning' : 'border-l-success'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${churnRisk === 'alto' || churnRisk === 'crítico' ? 'text-destructive' : churnRisk === 'médio' ? 'text-warning' : 'text-success'}`} />
            <div>
              <p className="text-sm font-medium">Risco de Churn: <span className="capitalize">{churnRisk}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company 360 Intelligence Card */}
      <ExternalDataCard 
        title="Inteligência 360°" 
        icon={<Brain className="h-4 w-4" />} 
        isLoading={c360Loading} 
        error={c360Error} 
        onRetry={refetch360} 
        hasData={!!company360}
        emptyMessage="Dados de inteligência ainda não disponíveis"
      >
        {company360 && <Company360Card data={company360} />}
      </ExternalDataCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Relationship Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Saúde do Relacionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{avgRelationshipScore}%</div>
            <p className="text-sm text-muted-foreground">
              Score médio de relacionamento com {contacts.length} contatos
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>0%</span><span>100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                  style={{ width: `${avgRelationshipScore}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Interações</span>
                <span className="font-semibold">{totalInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interações Positivas</span>
                <span className="font-semibold text-success">{positiveInteractions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Follow-ups Pendentes</span>
                <span className={`font-semibold ${pendingFollowUps > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {pendingFollowUps}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos Chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contacts.slice(0, 6).map(contact => {
                  const behavior = contact.behavior as { discProfile?: DISCProfile } | null;
                  return (
                    <Link key={contact.id} to={`/contatos/${contact.id}`}>
                      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <OptimizedAvatar 
                          src={contact.avatar_url || undefined}
                          alt={`${contact.first_name} ${contact.last_name}`}
                          fallback={`${safeInitial(contact.first_name)}${safeInitial(contact.last_name)}`}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <div className="flex items-center gap-1">
                            {behavior?.discProfile && (
                              <DISCBadge profile={behavior.discProfile} size="sm" showLabel={false} />
                            )}
                            <span className="text-xs text-muted-foreground">{contact.relationship_score}%</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Touchpoint Summary */}
      {touchpoints && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Resumo de Touchpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{touchpoints.total_touchpoints}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{touchpoints.avg_gap_days?.toFixed(0) || 0}d</div>
                <div className="text-[10px] text-muted-foreground">Gap Médio</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-sm font-medium">{touchpoints.last_touchpoint ? new Date(touchpoints.last_touchpoint).toLocaleDateString('pt-BR') : '—'}</div>
                <div className="text-[10px] text-muted-foreground">Último</div>
              </div>
            </div>
            {touchpoints.by_channel && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(touchpoints.by_channel).map(([channel, count]) => (
                  <Badge key={channel} variant="outline" className="text-[10px]">
                    {channel}: {count as number}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Contacts from RPC */}
      {keyContacts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contatos Estratégicos
              <Badge variant="outline" className="text-[10px] ml-auto">{keyContacts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyContacts.slice(0, 5).map((kc) => (
                <div key={kc.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{kc.name}</p>
                    {kc.role && <p className="text-[10px] text-muted-foreground">{kc.role}</p>}
                  </div>
                  <Badge variant={kc.importance_score >= 70 ? 'default' : 'secondary'} className="text-[10px]">
                    {kc.importance_score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Timeline */}
      <ExternalDataCard 
        title="Timeline da Empresa" 
        icon={<Clock className="h-4 w-4" />} 
        isLoading={timelineLoading} 
        error={timelineError} 
        onRetry={refetchTimeline} 
        hasData={timeline.length > 0}
        emptyMessage="Nenhum evento na timeline"
      >
        <CompanyTimelineCard timeline={timeline} />
      </ExternalDataCard>
    </motion.div>

    {/* Intelligence Widgets */}
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <CompanyHealthScoreWidget companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <CompanyStatisticsWidget companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <PropensityScoreWidget companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <AccountPlanWidget companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <CompanyBenchmarkRadar companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <CompanyDuplicatesWidget companyId={companyId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-20 rounded-lg" />}>
        <OptimalContactWindowsWidget companyId={companyId} />
      </Suspense>
    </div>

    <Suspense fallback={<Skeleton className="h-16 rounded-lg" />}>
      <QuickActionsWidget companyId={companyId} />
    </Suspense>
    <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
      <CompanyViewsWidget companyId={companyId} />
    </Suspense>
    <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
      <InteractionHistoryWidget companyId={companyId} />
    </Suspense>
    <Suspense fallback={<Skeleton className="h-20 rounded-lg" />}>
      <CreateDealWidget companyId={companyId} />
    </Suspense>
    </>
  );
}
