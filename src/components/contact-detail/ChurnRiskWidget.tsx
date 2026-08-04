import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useChurnRisk } from '@/hooks/useChurnRisk';
import { AlertTriangle, ShieldAlert, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WhyScoreDrawer, type WhyScoreFactor } from '@/components/intelligence/WhyScoreDrawer';

const RISK_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; badgeClass: string }> = {
  critical: { icon: ShieldAlert, color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30' },
  high: { icon: AlertTriangle, color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30' },
  medium: { icon: Info, color: 'text-warning', badgeClass: 'bg-warning/10 text-warning border-warning/30' },
  low: { icon: ShieldCheck, color: 'text-success', badgeClass: 'bg-success/10 text-success border-success/30' },
};

export const ChurnRiskWidget = React.memo(function ChurnRiskWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useChurnRisk(contactId);
  const [whyOpen, setWhyOpen] = useState(false);

  const probability = data?.churn_probability != null ? Math.round(data.churn_probability * 100) : null;

  const factors = useMemo<WhyScoreFactor[]>(() => {
    if (!data) return [];
    const list: WhyScoreFactor[] = [];

    if (data.days_since_contact != null) {
      const score = Math.min(100, (data.days_since_contact / 60) * 100);
      list.push({
        key: 'days-since-contact',
        label: 'Dias sem contato',
        score: Math.round(score),
        weight: 0.3,
        detail: `${data.days_since_contact}d desde a última interação`,
      });
    }

    if (data.relationship_score != null) {
      list.push({
        key: 'relationship',
        label: 'Score de relacionamento',
        score: Math.round(100 - Math.min(100, data.relationship_score)),
        weight: 0.25,
        detail: `Score atual ${data.relationship_score}/100 (invertido p/ risco)`,
      });
    }

    if (data.interactions_30d != null) {
      const decay = Math.max(0, 100 - data.interactions_30d * 20);
      list.push({
        key: 'interactions-30d',
        label: 'Engajamento (30d)',
        score: Math.round(decay),
        weight: 0.2,
        detail: `${data.interactions_30d} interações nos últimos 30d`,
      });
    }

    (data.risk_factors ?? []).slice(0, 4).forEach((f, i) => {
      list.push({
        key: `risk-${i}`,
        label: f,
        score: 70,
        weight: 0.0625, // 4 fatores qualitativos compõem ~25%
        detail: 'Fator qualitativo detectado',
      });
    });

    return list;
  }, [data]);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Risco de Churn</CardTitle></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>;
  if (!data) return null;

  const risk = RISK_CONFIG[data.risk_level?.toLowerCase() || 'low'] || RISK_CONFIG.low;
  const RiskIcon = risk.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><RiskIcon className={cn("h-4 w-4", risk.color)} />Risco de Churn</span>
          <Badge variant="outline" className={cn("text-[10px]", risk.badgeClass)}>{data.risk_level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {probability != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Probabilidade</span>
              <span className="font-bold">{probability}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>
        )}
        {data.days_since_contact != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Dias sem contato</span>
            <span className={cn("font-semibold", data.days_since_contact > 30 ? 'text-destructive' : data.days_since_contact > 14 ? 'text-warning' : 'text-foreground')}>{data.days_since_contact}d</span>
          </div>
        )}
        {data.risk_factors && data.risk_factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Fatores de Risco</p>
            <div className="flex flex-wrap gap-1">{data.risk_factors.slice(0, 4).map((f, i) => <Badge key={i} variant="outline" className="text-[9px]">{f}</Badge>)}</div>
          </div>
        )}
        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Ações Recomendadas</p>
            <ul className="space-y-0.5">{data.recommended_actions.slice(0, 3).map((a, i) => <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1"><span className="text-primary mt-0.5">•</span>{a}</li>)}</ul>
          </div>
        )}
        {(probability != null || factors.length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[11px] gap-1.5"
            onClick={() => setWhyOpen(true)}
          >
            <Sparkles className="h-3 w-3" />
            Por que esse score?
          </Button>
        )}
      </CardContent>

      {probability != null && (
        <WhyScoreDrawer
          open={whyOpen}
          onOpenChange={setWhyOpen}
          scoreKey={`churn-risk:contact:${contactId}`}
          title={data.contact_name ? `Churn · ${data.contact_name}` : 'Risco de Churn'}
          subtitle={`Probabilidade ${probability}% — ${data.risk_level ?? 'low'}`}
          score={probability}
          factors={factors}
          recommendations={data.recommended_actions ?? []}
          band={probability >= 70 ? 'low' : probability >= 40 ? 'mid' : 'high'}
        />
      )}
    </Card>
  );
});

export default ChurnRiskWidget;
