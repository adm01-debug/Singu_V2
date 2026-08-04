import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import type { ABMAccount } from "@/hooks/useABM";

export function AccountScoreCard({ account }: { account: ABMAccount }) {
  const breakdown = account.score_breakdown ?? {};
  const dimensions = [
    { label: "Fit Firmográfico", value: breakdown.fit ?? 0, max: 30 },
    { label: "Engajamento", value: breakdown.engagement ?? 0, max: 30 },
    { label: "Intent", value: breakdown.intent ?? 0, max: 25 },
    { label: "Influência", value: breakdown.influence ?? 0, max: 25 },
  ];

  const scoreColor =
    account.account_score >= 75 ? "text-success" : account.account_score >= 50 ? "text-warning" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Account Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${scoreColor}`}>{account.account_score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <div className="space-y-3">
          {dimensions.map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-medium">{d.value}/{d.max}</span>
              </div>
              <Progress value={(d.value / d.max) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
        {account.last_scored_at && (
          <p className="text-[10px] text-muted-foreground">
            Última avaliação: {new Date(account.last_scored_at).toLocaleString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
