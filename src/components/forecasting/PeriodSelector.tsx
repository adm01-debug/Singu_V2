import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ForecastPeriod } from "@/hooks/useForecasting";

export function PeriodSelector({ periods, value, onChange }: { periods: ForecastPeriod[]; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecionar período" /></SelectTrigger>
      <SelectContent>
        {periods.map(p => (
          <SelectItem key={p.id} value={p.id}>
            {p.period_type === "month" ? "Mês" : "Trimestre"} • {new Date(p.period_start).toLocaleDateString("pt-BR")} → {new Date(p.period_end).toLocaleDateString("pt-BR")} {p.status === "closed" ? "(fechado)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
