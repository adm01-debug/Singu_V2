import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type RevOpsPeriod = "7d" | "30d" | "90d" | "qtd";

export function RevOpsPeriodSelector({ value, onChange }: { value: RevOpsPeriod; onChange: (v: RevOpsPeriod) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RevOpsPeriod)}>
      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Últimos 7 dias</SelectItem>
        <SelectItem value="30d">Últimos 30 dias</SelectItem>
        <SelectItem value="90d">Últimos 90 dias</SelectItem>
        <SelectItem value="qtd">Trimestre atual</SelectItem>
      </SelectContent>
    </Select>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getRange(p: RevOpsPeriod): { start: string; end: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let days = 30;
  let start: Date;
  if (p === "qtd") {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    days = Math.ceil((now.getTime() - start.getTime()) / (24 * 3600 * 1000));
  } else {
    days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
    start = new Date(Date.now() - days * 24 * 3600 * 1000);
  }
  const prevEndD = new Date(start.getTime() - 24 * 3600 * 1000);
  const prevStartD = new Date(prevEndD.getTime() - days * 24 * 3600 * 1000);
  return {
    start: start.toISOString().slice(0, 10),
    end,
    prevStart: prevStartD.toISOString().slice(0, 10),
    prevEnd: prevEndD.toISOString().slice(0, 10),
  };
}
