import { Card } from "@/components/ui/card";
import { CategoryBadge } from "./CategoryBadge";
import { HealthScoreIndicator } from "./HealthScoreIndicator";
import { useUpdateDealForecast, type DealForecast, type ForecastCategory } from "@/hooks/useForecasting";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

const COLUMNS: { key: ForecastCategory; label: string }[] = [
  { key: "commit", label: "Commit" },
  { key: "best_case", label: "Best Case" },
  { key: "pipeline", label: "Pipeline" },
  { key: "omitted", label: "Omitido" },
];

export function CategoryColumn({ deals }: { deals: DealForecast[] }) {
  const update = useUpdateDealForecast();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const items = deals.filter(d => d.category === col.key);
        const total = items.reduce((s, x) => s + Number(x.forecasted_amount), 0);
        return (
          <div key={col.key} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2"><CategoryBadge category={col.key} /><span className="text-xs text-muted-foreground">{items.length}</span></div>
              <span className="text-sm font-semibold">R$ {total.toLocaleString("pt-BR")}</span>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {items.map(d => (
                <Card key={d.id} className="p-3 space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium truncate flex-1">{d.deal_name ?? d.deal_id}</div>
                    <HealthScoreIndicator score={d.health_score} />
                  </div>
                  <div className="text-base font-bold">R$ {Number(d.forecasted_amount).toLocaleString("pt-BR")}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Conf: {d.confidence_score}%</span>
                    {d.forecasted_close_date && <span>{new Date(d.forecasted_close_date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                  <Select value={d.category} onValueChange={(v) => update.mutate({ id: d.id, patch: { category: v as ForecastCategory } })}>
                    <SelectTrigger className="h-7 text-xs"><ArrowRightLeft className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Card>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground italic px-1">Vazio</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
