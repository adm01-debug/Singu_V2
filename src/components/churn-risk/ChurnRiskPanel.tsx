import React from "react";
import { AlertTriangle, TrendingDown, Clock, RefreshCw, Shield, ArrowDown, Minus, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalChurnRisks, useAnalyzeChurnRisk, type LocalChurnRisk } from "@/hooks/useChurnRisk";

const RISK_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: "Crítico", color: "text-red-500", icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
  high: { label: "Alto", color: "text-orange-500", icon: <TrendingDown className="h-4 w-4 text-orange-500" /> },
  medium: { label: "Médio", color: "text-yellow-500", icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  low: { label: "Baixo", color: "text-emerald-500", icon: <Shield className="h-4 w-4 text-emerald-500" /> },
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  declining: <ArrowDown className="h-3 w-3 text-red-400" />,
  stable: <Minus className="h-3 w-3 text-muted-foreground" />,
  growing: <ArrowUp className="h-3 w-3 text-emerald-400" />,
  mixed: <Minus className="h-3 w-3 text-yellow-400" />,
  positive: <ArrowUp className="h-3 w-3 text-emerald-400" />,
};

function RiskScoreBar({ score, level }: { score: number; level: string }) {
  const colorClass = level === "critical" ? "bg-red-500" : level === "high" ? "bg-orange-500" : level === "medium" ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Risco</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RiskItem({ risk, contactName }: { risk: LocalChurnRisk; contactName?: string }) {
  const config = RISK_CONFIG[risk.risk_level] || RISK_CONFIG.low;
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-medium text-sm">{contactName || risk.contact_id.slice(0, 8)}</span>
        </div>
        <Badge variant="outline" className={config.color}>{config.label}</Badge>
      </div>
      <RiskScoreBar score={risk.risk_score} level={risk.risk_level} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {risk.days_since_last_interaction != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {risk.days_since_last_interaction}d
          </span>
        )}
        {risk.sentiment_trend && (
          <span className="flex items-center gap-1">
            {TREND_ICONS[risk.sentiment_trend]} Sentimento
          </span>
        )}
        {risk.score_trend && (
          <span className="flex items-center gap-1">
            {TREND_ICONS[risk.score_trend]} Score
          </span>
        )}
      </div>
      {Array.isArray(risk.recommendations) && risk.recommendations.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-1">
          {risk.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-primary mt-0.5">•</span> {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ChurnRiskPanelProps {
  contactId?: string;
  contactName?: string;
  compact?: boolean;
}

export default function ChurnRiskPanel({ contactId, contactName, compact }: ChurnRiskPanelProps) {
  const { data: risks = [], isLoading } = useLocalChurnRisks(contactId);
  const analyze = useAnalyzeChurnRisk();

  const criticalCount = risks.filter((r) => r.risk_level === "critical").length;
  const highCount = risks.filter((r) => r.risk_level === "high").length;

  if (compact && risks.length === 0 && !isLoading) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Risco de Churn
          {(criticalCount > 0 || highCount > 0) && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {criticalCount + highCount}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => analyze.mutate(contactId)}
          disabled={analyze.isPending}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${analyze.isPending ? "animate-spin" : ""}`} />
          Analisar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : risks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum risco detectado. Clique em Analisar.</p>
        ) : (
          (compact ? risks.slice(0, 3) : risks).map((risk) => (
            <RiskItem key={risk.id} risk={risk} contactName={contactName} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
