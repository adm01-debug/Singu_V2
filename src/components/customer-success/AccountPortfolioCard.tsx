import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { TrendingDown, TrendingUp, Minus, CalendarClock, DollarSign } from "lucide-react";
import { HealthScoreGauge } from "./HealthScoreGauge";
import type { CSAccount } from "@/hooks/useCustomerSuccess";
import { cn } from "@/lib/utils";

const TIER_STYLES: Record<string, string> = {
  strategic: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  enterprise: "bg-primary/15 text-primary border-primary/30",
  mid: "bg-muted text-muted-foreground border-border",
  smb: "bg-muted/60 text-muted-foreground border-border",
};

const STAGE_STYLES: Record<string, string> = {
  onboarding: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  adopting: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  mature: "bg-success/10 text-success border-success/30",
  at_risk: "bg-destructive/10 text-destructive border-destructive/30",
  churned: "bg-muted text-muted-foreground border-border",
};

export function AccountPortfolioCard({ account }: { account: CSAccount }) {
  const TrendIcon = account.health_trend === "up" ? TrendingUp : account.health_trend === "down" ? TrendingDown : Minus;
  const trendColor = account.health_trend === "up" ? "text-success" : account.health_trend === "down" ? "text-destructive" : "text-muted-foreground";
  const daysToRenewal = account.renewal_date ? Math.ceil((new Date(account.renewal_date).getTime() - Date.now()) / 86400000) : null;
  const renewalUrgent = daysToRenewal !== null && daysToRenewal <= 60;

  return (
    <Link to={`/customer-success/account/${account.id}`} className="block">
      <Card className="hover:border-primary/40 transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <HealthScoreGauge score={account.health_score} size="md" showLabel={false} />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate">{account.account_name}</h3>
                <TrendIcon className={cn("h-4 w-4 shrink-0", trendColor)} />
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className={cn("text-[10px] capitalize", TIER_STYLES[account.tier])}>{account.tier}</Badge>
                <Badge variant="outline" className={cn("text-[10px] capitalize", STAGE_STYLES[account.lifecycle_stage])}>{account.lifecycle_stage.replace("_", " ")}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{(account.arr / 1000).toFixed(0)}k ARR</span>
                {daysToRenewal !== null && (
                  <span className={cn("flex items-center gap-1", renewalUrgent && "text-warning font-medium")}>
                    <CalendarClock className="h-3 w-3" />
                    {daysToRenewal > 0 ? `${daysToRenewal}d` : "Vencido"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
