import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountChurnPrediction } from '@/hooks/useAccountChurnPrediction';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ChurnSingleAccountView } from './churn/ChurnSingleAccountView';
import { getRiskColor, getRiskBgColor, getRiskBadgeColor, getRiskLabel, getHealthIcon, getTrendIcon } from './churn/ChurnHelpers';
import { ShieldCheck } from 'lucide-react';

interface AccountChurnPredictionPanelProps {
  companyId?: string;
  compact?: boolean;
}

export function AccountChurnPredictionPanel({ companyId, compact = false }: AccountChurnPredictionPanelProps) {
  const { accountChurnAnalysis, atRiskAccounts, criticalCount, highRiskCount, portfolioHealthScore, loading } = useAccountChurnPrediction();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const displayedAccounts = companyId
    ? accountChurnAnalysis.filter(a => a.companyId === companyId)
    : atRiskAccounts.slice(0, compact ? 3 : 10);

  const singleAccount = companyId ? displayedAccounts[0] : null;

  if (loading) {
    return (<Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</CardContent></Card>);
  }

  if (singleAccount) return <ChurnSingleAccountView account={singleAccount} />;

  return (
    <Card className={cn(!compact && "col-span-full")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {getHealthIcon(portfolioHealthScore)}
          <div>
            <CardTitle className="text-lg">Risco de Churn por Conta</CardTitle>
            <p className="text-sm text-muted-foreground">Baseado em stakeholders e padrões de engajamento</p>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive" /><span className="text-muted-foreground">Crítico: {criticalCount}</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning" /><span className="text-muted-foreground">Alto: {highRiskCount}</span></div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Saúde do Portfólio: <span className={cn("font-medium ml-1", portfolioHealthScore >= 70 ? "text-success" : portfolioHealthScore >= 40 ? "text-warning" : "text-destructive")}>{portfolioHealthScore}%</span></span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayedAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
            <p className="font-medium">Nenhuma conta em risco</p>
            <p className="text-sm">Todas as suas contas estão saudáveis!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAccounts.map((account, index) => (
              <motion.div key={account.companyId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div
                  className={cn("p-4 rounded-lg border cursor-pointer transition-all", getRiskBgColor(account.riskLevel), expandedAccount === account.companyId && "ring-2 ring-primary")}
                  onClick={() => setExpandedAccount(expandedAccount === account.companyId ? null : account.companyId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedAccount === account.companyId ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Link to={`/empresas/${account.companyId}`} className="font-medium hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>{account.companyName}</Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{account.contacts.length} stakeholders</span>
                          <span className="flex items-center gap-1">{getTrendIcon(account.engagementTrend)}{account.engagementTrend === 'improving' ? 'Melhorando' : account.engagementTrend === 'declining' ? 'Declinando' : account.engagementTrend === 'critical' ? 'Crítico' : 'Estável'}</span>
                          {account.criticalAlerts > 0 && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" />{account.criticalAlerts} alertas</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><span className="text-xs">🌟 {account.championCount}</span><span className="text-xs">🚫 {account.blockerCount}</span></div>
                      <div className="text-right">
                        <div className={cn("text-2xl font-bold", getRiskColor(account.riskLevel))}>{account.riskScore}%</div>
                        <Badge className={cn("text-xs", getRiskBadgeColor(account.riskLevel))}>{getRiskLabel(account.riskLevel)}</Badge>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedAccount === account.companyId && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t space-y-4" onClick={(e) => e.stopPropagation()}>
                        {account.riskFactors.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Fatores de Risco</h5>
                            <div className="flex flex-wrap gap-2">
                              {account.riskFactors.map((factor, idx) => <Badge key={idx} variant="outline" className="text-xs">{factor.icon} {factor.factor} (+{factor.impact}%)</Badge>)}
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Ações Recomendadas</h5>
                          <ul className="space-y-1">
                            {account.recommendedActions.slice(0, 3).map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span>{action}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2"><span className="text-xs">🌟 {account.championCount} champions</span><span className="text-xs">👍 {account.contacts.length - account.championCount - account.blockerCount - account.neutralCount} apoiadores</span><span className="text-xs">😐 {account.neutralCount} neutros</span><span className="text-xs">🚫 {account.blockerCount} bloqueadores</span></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
