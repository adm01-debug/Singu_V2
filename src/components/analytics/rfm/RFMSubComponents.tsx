import React, { useMemo } from 'react';
import type { RFMHistory } from '@/types/rfm';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowUp, ArrowDown, Minus, RefreshCw, ChevronRight, Zap, Clock,
  Percent, AlertTriangle, Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RFM_SEGMENTS, RFMSegment, RFMAnalysis } from '@/types/rfm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// eslint-disable-next-line react-refresh/only-export-components
export const SEGMENT_ICONS: Record<RFMSegment, React.ReactNode> = {
  champions: <span className="text-base">🏆</span>,
  loyal_customers: <span className="text-base">❤️</span>,
  potential_loyalists: <span className="text-base">⭐</span>,
  recent_customers: <span className="text-base">✨</span>,
  promising: <span className="text-base">📈</span>,
  needing_attention: <span className="text-base">🔔</span>,
  about_to_sleep: <span className="text-base">🌙</span>,
  at_risk: <span className="text-base">⚠️</span>,
  cant_lose: <span className="text-base">🛡️</span>,
  hibernating: <span className="text-base">⏸️</span>,
  lost: <span className="text-base">❌</span>,
};

// eslint-disable-next-line react-refresh/only-export-components
export const SEGMENT_COLORS: Record<RFMSegment, string> = {
  champions: '#10b981',
  loyal_customers: '#22c55e',
  potential_loyalists: '#06b6d4',
  recent_customers: '#3b82f6',
  promising: '#6366f1',
  needing_attention: '#eab308',
  about_to_sleep: '#f97316',
  at_risk: '#ef4444',
  cant_lose: '#dc2626',
  hibernating: '#6b7280',
  lost: '#9ca3af',
};

export function MetricCard({ icon, label, value, suffix = '', color, trend }: {
  icon: React.ReactNode; label: string; value: string | number; suffix?: string; color: string; trend?: 'up' | 'down';
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-info text-info dark:bg-info/50',
    purple: 'bg-secondary text-secondary dark:bg-secondary/50',
    red: 'bg-destructive text-destructive dark:bg-destructive/50',
    emerald: 'bg-success text-success dark:bg-success/50',
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          {trend && (
            <div className={trend === 'up' ? 'text-success' : 'text-destructive'}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PriorityCard({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses: Record<string, { bg: string; bar: string }> = {
    red: { bg: 'bg-destructive dark:bg-destructive/30', bar: 'bg-destructive' },
    orange: { bg: 'bg-accent dark:bg-accent/30', bar: 'bg-accent' },
    blue: { bg: 'bg-info dark:bg-info/30', bar: 'bg-info' },
    gray: { bg: 'bg-muted', bar: 'bg-muted-foreground' },
  };
  return (
    <div className={`p-4 rounded-lg ${colorClasses[color].bg}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
      <div className="mt-2">
        <div className="h-2 bg-foreground/20 rounded-full overflow-hidden">
          <div className={`h-full ${colorClasses[color].bar} transition-all`} style={{ width: `${percentage}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
      </div>
    </div>
  );
}

export function SegmentCard({ segmentKey, segment, count, percentage, icon }: {
  segmentKey: RFMSegment; segment: typeof RFM_SEGMENTS[RFMSegment]; count: number; percentage: number; icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${segment.bgColor} ${segment.color}`}>{icon}</div>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold">{segment.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
        </div>
        <div className="mt-4">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{percentage}% do total</span>
            <span className="text-xs text-muted-foreground">{segment.actionFocus}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    urgent: { color: 'bg-destructive text-destructive', label: 'Urgente' },
    high: { color: 'bg-accent text-accent', label: 'Alta' },
    medium: { color: 'bg-info text-info', label: 'Média' },
    low: { color: 'bg-muted text-muted-foreground', label: 'Baixa' },
  };
  const cfg = config[priority] || config.medium;
  return <Badge className={`${cfg.color} border-0`}>{cfg.label}</Badge>;
}

interface ContactRFMSummary {
  contactId: string;
  contactName: string;
  avatarUrl?: string;
  rfmAnalysis: RFMAnalysis;
}

export function ContactRFMCard({ summary }: { summary: ContactRFMSummary }) {
  const rfm = summary.rfmAnalysis;
  if (!rfm) return null;
  const segment = RFM_SEGMENTS[rfm.segment];
  return (
    <Link to={`/contatos/${summary.contactId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {summary.avatarUrl ? (
                <img src={summary.avatarUrl} alt={summary.contactName} className="w-10 h-10 rounded-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <span className="text-lg font-medium">{summary.contactName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{summary.contactName}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${segment.bgColor} ${segment.color} border-0`}>
                  {SEGMENT_ICONS[rfm.segment]}<span className="ml-1">{segment.name}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">R$ {rfm.totalMonetaryValue.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {(['R', 'F', 'M'] as const).map((label, i) => {
                const key = ['recencyScore', 'frequencyScore', 'monetaryScore'][i];
                const tooltip = ['Recência', 'Frequência', 'Monetário'][i];
                return (
                  <TooltipProvider key={label}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="font-bold">{rfm[key]}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            <PriorityBadge priority={rfm.communicationPriority} />
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ScoreCard({ label, score, detail, color, trend }: {
  label: string; score: number; detail: string; color: string; trend?: string | null;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-info text-info', green: 'bg-success text-success', amber: 'bg-warning text-warning',
  };
  const TrendIcon = trend === 'improving' ? ArrowUp : trend === 'declining' ? ArrowDown : Minus;
  const trendColor = trend === 'improving' ? 'text-success' : trend === 'declining' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <div className="text-3xl font-bold mt-1">{score}</div>
      <div className="text-sm opacity-80">{detail}</div>
    </div>
  );
}

export function ContactRFMDetail({ rfm, history, onRefresh, analyzing }: {
  rfm: RFMAnalysis; history: RFMHistory[]; onRefresh: () => void; analyzing: boolean;
}) {
  const segment = RFM_SEGMENTS[rfm.segment];
  const historyChartData = useMemo(() => {
    return history.slice().reverse().map(h => ({
      date: format(h.recordedAt, 'dd/MM', { locale: ptBR }),
      R: h.recencyScore, F: h.frequencyScore, M: h.monetaryScore,
      total: h.recencyScore + h.frequencyScore + h.monetaryScore,
    }));
  }, [history]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${segment.bgColor} ${segment.color}`}>{SEGMENT_ICONS[rfm.segment]}</div>
              <div>
                <CardTitle>Análise RFM</CardTitle>
                <CardDescription>Última análise: {format(rfm.analyzedAt, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={analyzing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`p-4 rounded-lg ${segment.bgColor}`}>
            <div className="flex items-center gap-2">{SEGMENT_ICONS[rfm.segment]}<span className={`font-semibold ${segment.color}`}>{segment.name}</span></div>
            <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
            <p className="text-sm mt-2"><strong>Foco:</strong> {segment.actionFocus}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ScoreCard label="Recência" score={rfm.recencyScore} detail={rfm.daysSinceLastPurchase ? `${rfm.daysSinceLastPurchase} dias` : 'N/A'} color="blue" trend={rfm.recencyTrend} />
            <ScoreCard label="Frequência" score={rfm.frequencyScore} detail={`${rfm.totalPurchases} compras`} color="green" trend={rfm.frequencyTrend} />
            <ScoreCard label="Monetário" score={rfm.monetaryScore} detail={`R$ ${rfm.totalMonetaryValue.toLocaleString('pt-BR')}`} color="amber" trend={rfm.monetaryTrend} />
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-muted-foreground">Score RFM Total</div><div className="text-3xl font-bold">{rfm.totalScore}/15</div></div>
              <div className="text-right"><div className="text-sm text-muted-foreground">Código RFM</div><div className="text-2xl font-mono font-bold">{rfm.recencyScore}{rfm.frequencyScore}{rfm.monetaryScore}</div></div>
            </div>
            <Progress value={(rfm.totalScore / 15) * 100} className="mt-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span className="text-sm">Próxima Compra Prevista</span></div>
              <div className="text-lg font-semibold mt-1">{rfm.predictedNextPurchaseDate ? format(rfm.predictedNextPurchaseDate, "dd 'de' MMM", { locale: ptBR }) : 'Indeterminado'}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground"><Percent className="h-4 w-4" /><span className="text-sm">Probabilidade de Churn</span></div>
              <div className={`text-lg font-semibold mt-1 ${(rfm.churnProbability || 0) > 50 ? 'text-destructive' : (rfm.churnProbability || 0) > 25 ? 'text-warning' : 'text-success'}`}>{rfm.churnProbability?.toFixed(0) || 0}%</div>
            </div>
          </div>
          {historyChartData.length > 1 && (
            <div>
              <h4 className="font-semibold mb-3">Evolução do Score</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" /><YAxis domain={[0, 5]} />
                    <RechartsTooltip /><Legend />
                    <Line type="monotone" dataKey="R" stroke="#3b82f6" name="Recência" />
                    <Line type="monotone" dataKey="F" stroke="#22c55e" name="Frequência" />
                    <Line type="monotone" dataKey="M" stroke="#f59e0b" name="Monetário" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {rfm.recommendedActions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ações Recomendadas</h4>
              <div className="space-y-2">
                {rfm.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary/10 text-primary p-2 rounded-full"><Zap className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div className="font-medium">{action.action}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                      <div className="flex gap-2 mt-2"><Badge variant="outline">{action.channel}</Badge><Badge variant="outline">{action.timing}</Badge></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rfm.recommendedOffers.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ofertas Sugeridas</h4>
              <div className="grid grid-cols-2 gap-3">
                {rfm.recommendedOffers.map((offer, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="font-medium">{offer.offerType}</div>
                    <div className="text-sm text-muted-foreground">{offer.description}</div>
                    {offer.discountPercent && <Badge className="mt-2 bg-success text-success">{offer.discountPercent}% OFF</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ActionsOverview({ rfmData }: { rfmData: RFMAnalysis[] }) {
  const actionsByPriority = useMemo(() => {
    interface ActionItem { contactId: string; segment: string; actions: RFMAnalysis['recommendedActions']; priority: string; }
    const urgent: ActionItem[] = [];
    const high: ActionItem[] = [];
    const medium: ActionItem[] = [];
    rfmData.forEach(rfm => {
      const item = { contactId: rfm.contactId, segment: rfm.segment, actions: rfm.recommendedActions, priority: rfm.communicationPriority };
      if (rfm.communicationPriority === 'urgent') urgent.push(item);
      else if (rfm.communicationPriority === 'high') high.push(item);
      else medium.push(item);
    });
    return { urgent, high, medium };
  }, [rfmData]);

  return (
    <div className="space-y-6">
      {actionsByPriority.urgent.length > 0 && (
        <Card className="border-destructive bg-destructive/50 dark:bg-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Ações Urgentes ({actionsByPriority.urgent.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionsByPriority.urgent.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <div className={`p-2 rounded-lg ${RFM_SEGMENTS[item.segment as RFMSegment].bgColor}`}>{SEGMENT_ICONS[item.segment as RFMSegment]}</div>
                  <div className="flex-1"><div className="font-medium">{item.actions[0]?.action}</div><div className="text-sm text-muted-foreground">{item.actions[0]?.description}</div></div>
                  <Link to={`/contatos/${item.contactId}`}><Button size="sm">Ver Contato</Button></Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {actionsByPriority.high.length > 0 && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent"><Bell className="h-5 w-5" />Alta Prioridade ({actionsByPriority.high.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionsByPriority.high.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">{SEGMENT_ICONS[item.segment as RFMSegment]}<span>{item.actions[0]?.action}</span></div>
                  <Link to={`/contatos/${item.contactId}`}><Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button></Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
