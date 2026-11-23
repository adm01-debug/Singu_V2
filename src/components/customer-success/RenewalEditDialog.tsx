import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateRenewal, type Renewal, type RenewalStatus } from "@/hooks/useCustomerSuccess";

const STATUS_LABEL: Record<RenewalStatus, string> = {
  upcoming: "A vencer",
  in_negotiation: "Em negociação",
  renewed: "Renovada",
  churned: "Perdida",
  downgraded: "Downgrade",
  expanded: "Expandida",
};

const RISK_LABEL: Record<Renewal["risk_level"], string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

interface Props {
  renewal: Pick<Renewal, "id" | "status" | "risk_level" | "forecasted_arr">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenewalEditDialog({ renewal, open, onOpenChange }: Props) {
  const [status, setStatus] = useState<RenewalStatus>(renewal.status);
  const [riskLevel, setRiskLevel] = useState<Renewal["risk_level"]>(renewal.risk_level);
  const [actualArr, setActualArr] = useState("");
  const update = useUpdateRenewal();

  const submit = async () => {
    await update.mutateAsync({
      id: renewal.id,
      status,
      risk_level: riskLevel,
      ...(actualArr.trim() ? { actual_arr: Number(actualArr) } : {}),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Atualizar renovação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as RenewalStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as RenewalStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Risco</Label>
            <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as Renewal["risk_level"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RISK_LABEL) as Array<Renewal["risk_level"]>).map(r => (
                  <SelectItem key={r} value={r}>{RISK_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ARR fechado (deixe vazio para manter o previsto)</Label>
            <Input
              type="number"
              value={actualArr}
              onChange={(e) => setActualArr(e.target.value)}
              placeholder={`Previsto: ${renewal.forecasted_arr}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={update.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}